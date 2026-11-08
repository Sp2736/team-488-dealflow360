// src/demo/db/store.ts
/**
 * In-memory & sessionStorage backed typed table store for DealFlow360 demo backend.
 * Provides atomic transactions, unique constraint checks, cascade/setNull deletions,
 * quota handling, referential integrity validation, and cross-tab handoff.
 */

import {
  type TableName,
  type DemoDatabaseSchema,
  TABLE_NAMES,
  UNIQUE_CONSTRAINTS,
  RELATIONS_ON_DELETE,
} from './schema';
import { validateTableRows } from './zodSchemas';
import { ApiError } from '../server/errors';
import { recordTableRead, recordTableWritten } from '../server/trace';

export const DB_STORAGE_KEY = 'df360.demo.db.v1';
export const META_STORAGE_KEY = 'df360.demo.meta';
export const HANDOFF_STORAGE_KEY = 'df360.demo.handoff';
export const CURRENT_SCHEMA_VERSION = 1;

export interface StoreMetadata {
  schemaVersion: number;
  seededAt: string;
  seedHash: string;
}

export interface HandoffData {
  db: DemoDatabaseSchema;
  session: unknown;
  expiresAt: number;
}

/**
 * Creates an empty database structure with all 33 tables initialized to empty arrays.
 */
export function createEmptyDatabase(): DemoDatabaseSchema {
  const db = {} as DemoDatabaseSchema;
  for (const table of TABLE_NAMES) {
    db[table] = [] as any;
  }
  return db;
}

/**
 * Deep clones the database object.
 */
export function cloneDatabase(db: DemoDatabaseSchema): DemoDatabaseSchema {
  return JSON.parse(JSON.stringify(db));
}

// Global active store instance
let activeStore: Store | null = null;
let seedGenerator: (() => { db: DemoDatabaseSchema; hash: string }) | null = null;

export function registerSeedGenerator(fn: () => { db: DemoDatabaseSchema; hash: string }) {
  seedGenerator = fn;
}

export class Store {
  private data: DemoDatabaseSchema;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isDegradedInMemory = false;

  constructor(initialData?: DemoDatabaseSchema) {
    this.data = initialData ? cloneDatabase(initialData) : createEmptyDatabase();
    this.setupFlushListeners();
  }

  private setupFlushListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
      window.addEventListener('pagehide', () => {
        this.flush();
      });
    }
  }

  /**
   * Internal data reference (use with care).
   */
  getRawData(): DemoDatabaseSchema {
    return this.data;
  }

  /**
   * Replace raw data and trigger save.
   */
  setRawData(newData: DemoDatabaseSchema, meta?: StoreMetadata): void {
    this.data = cloneDatabase(newData);
    this.persist(meta);
  }

  /**
   * Returns all records from a table.
   */
  all<T>(table: TableName): T[] {
    recordTableRead(table);
    const rows = this.data[table] || [];
    return (rows as unknown as T[]).map(r => ({ ...r }));
  }

  /**
   * Retrieves a record by ID.
   */
  get<T>(table: TableName, id: string): T | null {
    recordTableRead(table);
    const rows = (this.data[table] || []) as Array<{ id: string }>;
    const found = rows.find(r => r.id === id);
    return found ? ({ ...found } as unknown as T) : null;
  }

  /**
   * Filters records in a table matching the predicate.
   */
  where<T>(table: TableName, predicate: (item: T) => boolean): T[] {
    recordTableRead(table);
    const rows = (this.data[table] || []) as unknown as T[];
    return rows.filter(predicate).map(r => ({ ...r }));
  }

  /**
   * Counts records in a table, optionally matching a predicate.
   */
  count<T>(table: TableName, predicate?: (item: T) => boolean): number {
    recordTableRead(table);
    const rows = (this.data[table] || []) as unknown as T[];
    return predicate ? rows.filter(predicate).length : rows.length;
  }

  /**
   * Validates unique constraints before inserting or updating.
   */
  private checkUniqueConstraints<T extends Record<string, any>>(
    table: TableName,
    record: T,
    excludeId?: string
  ): void {
    const constraints = UNIQUE_CONSTRAINTS[table] || [];
    if (constraints.length === 0) return;

    const rows = (this.data[table] || []) as Array<Record<string, any>>;

    for (const fields of constraints) {
      const match = rows.find(existing => {
        if (excludeId && existing.id === excludeId) return false;
        return fields.every(f => {
          const valA = existing[f];
          const valB = record[f];
          if (valA === undefined || valA === null || valB === undefined || valB === null) {
            return false;
          }
          return valA === valB;
        });
      });

      if (match) {
        const valStr = fields.map(f => `${f}=${record[f]}`).join(', ');
        throw ApiError.conflict(
          `Unique constraint failed on ${table} (${fields.join(', ')}): record with ${valStr} already exists`
        );
      }
    }
  }

  /**
   * Inserts a new record into a table.
   */
  insert<T extends { id: string }>(table: TableName, record: T): T {
    recordTableWritten(table);
    this.checkUniqueConstraints(table, record);

    const rows = this.data[table] as unknown as T[];
    const cloned = { ...record };
    rows.push(cloned);

    this.scheduleSave();
    return { ...cloned };
  }

  /**
   * Updates an existing record by ID.
   */
  update<T extends Record<string, any>>(table: TableName, id: string, patch: Partial<T>): T {
    recordTableWritten(table);
    const rows = this.data[table] as Array<Record<string, any>>;
    const index = rows.findIndex(r => r.id === id);

    if (index === -1) {
      throw ApiError.notFound(`Record ${id} in ${table} not found`);
    }

    const current = rows[index];
    const updated = {
      ...current,
      ...patch,
      ...(current.updatedAt !== undefined && !('updatedAt' in patch) && { updatedAt: new Date().toISOString() }),
    };

    this.checkUniqueConstraints(table, updated, id);
    rows[index] = updated;

    this.scheduleSave();
    return { ...updated } as unknown as T;
  }

  /**
   * Removes a record by ID, emulating Prisma Cascade and SetNull semantics.
   */
  remove(table: TableName, id: string): boolean {
    recordTableWritten(table);
    const rows = this.data[table] as Array<{ id: string }>;
    const index = rows.findIndex(r => r.id === id);
    if (index === -1) return false;

    // Apply relations on delete
    const relations = RELATIONS_ON_DELETE[table] || [];
    for (const rel of relations) {
      const childRows = (this.data[rel.foreignTable] || []) as Array<Record<string, any>>;

      if (rel.onDelete === 'Cascade') {
        const matchingChildren = childRows.filter(c => c[rel.foreignKey] === id);
        for (const child of matchingChildren) {
          this.remove(rel.foreignTable, child.id);
        }
      } else if (rel.onDelete === 'SetNull') {
        for (const child of childRows) {
          if (child[rel.foreignKey] === id) {
            child[rel.foreignKey] = null;
          }
        }
      }
    }

    // Delete the row itself
    rows.splice(index, 1);
    this.scheduleSave();
    return true;
  }

  /**
   * Executes an atomic transaction. If fn throws, the database rolls back to its exact prior state.
   */
  transaction<R>(fn: (tx: Store) => R): R {
    const backup = cloneDatabase(this.data);
    try {
      const result = fn(this);
      this.scheduleSave();
      return result;
    } catch (err) {
      this.data = backup;
      throw err;
    }
  }

  /**
   * Debounced save (~100 ms).
   */
  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.flush();
    }, 100);
  }

  /**
   * Immediately flushes changes to sessionStorage.
   */
  flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.persist();
  }

  /**
   * Persists database state to sessionStorage, handling quota and pruning.
   */
  private persist(explicitMeta?: StoreMetadata): void {
    if (typeof window === 'undefined' || this.isDegradedInMemory) return;

    try {
      const serialized = JSON.stringify(this.data);
      // Size budget check (2.5 MB)
      if (serialized.length > 2.5 * 1024 * 1024) {
        this.pruneOldData();
      }

      window.sessionStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));

      if (explicitMeta) {
        window.sessionStorage.setItem(META_STORAGE_KEY, JSON.stringify(explicitMeta));
      }
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        // Prune oldest rows and retry once
        this.pruneOldData();
        try {
          window.sessionStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
        } catch {
          this.isDegradedInMemory = true;
          console.warn('[DealFlow360 Demo] Storage quota exceeded; operating in in-memory mode.');
        }
      }
    }
  }

  /**
   * Prunes oldest non-critical rows to fit inside the storage budget.
   */
  pruneOldData(): void {
    const MAX_AUDIT = 150;
    const MAX_NOTIF = 50;
    const MAX_HEALTH = 100;

    if (this.data.AuditLog.length > MAX_AUDIT) {
      this.data.AuditLog = this.data.AuditLog.slice(-MAX_AUDIT);
    }
    if (this.data.Notification.length > MAX_NOTIF) {
      this.data.Notification = this.data.Notification.slice(-MAX_NOTIF);
    }
    if (this.data.DealHealthEvent.length > MAX_HEALTH) {
      this.data.DealHealthEvent = this.data.DealHealthEvent.slice(-MAX_HEALTH);
    }
  }
}

/**
 * Validates referential integrity of a database snapshot.
 */
export function validateReferentialIntegrity(db: DemoDatabaseSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const customerIds = new Set(db.Customer.map(c => c.id));
  const productIds = new Set(db.Product.map(p => p.id));
  const userIds = new Set(db.User.map(u => u.id));
  const quoteIds = new Set(db.Quote.map(q => q.id));
  // Check quotes
  for (const q of db.Quote) {
    if (!customerIds.has(q.customerId)) {
      errors.push(`Quote ${q.id} references missing customer ${q.customerId}`);
    }
    if (!userIds.has(q.salesRepId)) {
      errors.push(`Quote ${q.id} references missing sales rep ${q.salesRepId}`);
    }
  }

  // Check quote lines
  for (const ql of db.QuoteLine) {
    if (!quoteIds.has(ql.quoteId)) {
      errors.push(`QuoteLine ${ql.id} references missing quote ${ql.quoteId}`);
    }
    if (!productIds.has(ql.productId)) {
      errors.push(`QuoteLine ${ql.id} references missing product ${ql.productId}`);
    }
  }

  // Check orders
  for (const o of db.Order) {
    if (!quoteIds.has(o.quoteId)) {
      errors.push(`Order ${o.id} references missing quote ${o.quoteId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the full database against Zod schemas.
 */
export function validateDatabaseSchemas(db: DemoDatabaseSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const table of TABLE_NAMES) {
    const rows = db[table] || [];
    const res = validateTableRows(table, rows);
    if (!res.valid && res.errors) {
      errors.push(...res.errors);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Handoff utilities for cross-tab navigation.
 */
export function prepareHandoff(db: DemoDatabaseSchema, session: unknown): void {
  if (typeof window === 'undefined') return;
  const handoff: HandoffData = {
    db: cloneDatabase(db),
    session,
    expiresAt: Date.now() + 30000, // 30 seconds expiry
  };
  window.localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(handoff));
}

export function consumeHandoff(): HandoffData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
    const data: HandoffData = JSON.parse(raw);
    if (data.expiresAt && Date.now() < data.expiresAt) {
      return data;
    }
    return null;
  } catch {
    window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
    return null;
  }
}

/**
 * Reseeds the database using the registered seed generator or a basic starter seed.
 */
export function reseedStore(store: Store): void {
  if (seedGenerator) {
    const { db, hash } = seedGenerator();
    store.setRawData(db, {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      seededAt: new Date().toISOString(),
      seedHash: hash,
    });
    return;
  }

  // Fallback empty seed with tables ready
  const empty = createEmptyDatabase();
  store.setRawData(empty, {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    seededAt: new Date().toISOString(),
    seedHash: 'initial-fallback',
  });
}

/**
 * Retrieves the global store singleton, hydrating from sessionStorage, handoff, or reseeding.
 */
export function getStore(): Store {
  if (activeStore) return activeStore;

  if (typeof window === 'undefined') {
    activeStore = new Store(createEmptyDatabase());
    return activeStore;
  }

  // Check for cross-tab handoff first if sessionStorage is empty
  const storedDbRaw = window.sessionStorage.getItem(DB_STORAGE_KEY);
  if (!storedDbRaw) {
    const handoff = consumeHandoff();
    if (handoff && handoff.db) {
      activeStore = new Store(handoff.db);
      activeStore.flush();
      return activeStore;
    }
  }

  // Load from sessionStorage
  if (storedDbRaw) {
    try {
      const parsedDb = JSON.parse(storedDbRaw);
      const metaRaw = window.sessionStorage.getItem(META_STORAGE_KEY);
      const meta: StoreMetadata | null = metaRaw ? JSON.parse(metaRaw) : null;

      if (meta && meta.schemaVersion === CURRENT_SCHEMA_VERSION) {
        const schemaValidation = validateDatabaseSchemas(parsedDb);
        const integrityValidation = validateReferentialIntegrity(parsedDb);

        if (schemaValidation.valid && integrityValidation.valid) {
          activeStore = new Store(parsedDb);
          return activeStore;
        }
      }
    } catch {
      // Storage corrupted, reseed below
    }
  }

  // Seed fresh
  activeStore = new Store(createEmptyDatabase());
  reseedStore(activeStore);
  return activeStore;
}
