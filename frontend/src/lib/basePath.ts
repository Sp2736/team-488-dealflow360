export const withBasePath = (p: string): string => {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!p) return base || '/';
  if (p.startsWith(base) && base !== '') return p;
  return base + (p.startsWith('/') ? p : `/${p}`);
};

