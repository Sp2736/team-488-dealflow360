// src/demo/db/seed/fictional.ts
/**
 * Fictional names, catalogs, and constants for DealFlow360 Demo.
 * 100% fictional: strictly uses @example.com, obviously fictional businesses,
 * mock GSTIN/PAN patterns, and test addresses.
 */

export const FICTIONAL_COMPANIES = [
  { name: 'Acme Global Ltd', tier: 'GOLD', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Northwind Mock Ltd', tier: 'SILVER', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Globex Demo Pvt Ltd', tier: 'GOLD', city: 'Hyderabad', state: 'Telangana' },
  { name: 'Initech Sample Co', tier: 'SILVER', city: 'Pune', state: 'Maharashtra' },
  { name: 'Umbrella Test Labs', tier: 'BRONZE', city: 'Gurugram', state: 'Haryana' },
  { name: 'Stark Logistics Demo', tier: 'GOLD', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Wayne Tech Labs', tier: 'GOLD', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Cyberdyne Systems Demo', tier: 'SILVER', city: 'Noida', state: 'Uttar Pradesh' },
  { name: 'Soylent Foods Mock', tier: 'BRONZE', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Massive Dynamic Demo', tier: 'GOLD', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Hooli Tech Pvt Ltd', tier: 'SILVER', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Pied Piper Demo', tier: 'SILVER', city: 'Hyderabad', state: 'Telangana' },
  { name: 'Dunder Mifflin Paper Co', tier: 'BRONZE', city: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Vandelay Industries Test', tier: 'BRONZE', city: 'Jaipur', state: 'Rajasthan' },
  { name: 'Aperture Science Demo', tier: 'GOLD', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Black Mesa Mock Labs', tier: 'GOLD', city: 'Delhi', state: 'Delhi' },
  { name: 'Wonka Confectionery Demo', tier: 'SILVER', city: 'Kochi', state: 'Kerala' },
  { name: 'Tyrell Corp Mock', tier: 'GOLD', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Weyland-Yutani Demo', tier: 'SILVER', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Oscorp Tech Labs', tier: 'BRONZE', city: 'Chandigarh', state: 'Punjab' },
  { name: 'Sterling Cooper Demo', tier: 'BRONZE', city: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Monsters Inc Mock', tier: 'SILVER', city: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Prestige Worldwide Demo', tier: 'BRONZE', city: 'Goa', state: 'Goa' },
  { name: 'Gekko & Co Mock', tier: 'GOLD', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Omni Consumer Products Test', tier: 'SILVER', city: 'Bhubaneswar', state: 'Odisha' },
  // Edge cases (26-30):
  { name: 'Edge Case - No Tier Ltd', tier: null, city: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Edge Case - No Contact Corp', tier: 'BRONZE', city: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Edge Case - No Email Enterprises', tier: 'SILVER', city: 'Surat', state: 'Gujarat' },
  { name: 'Edge Case - Inactive Partner', tier: 'GOLD', city: 'Vadodara', state: 'Gujarat', inactive: true },
  { name: 'Edge Case - Churned Customer Co', tier: 'BRONZE', city: 'Nagpur', state: 'Maharashtra', inactive: true },
];

export const STATE_GST_CODES: Record<string, string> = {
  Karnataka: '29',
  Maharashtra: '27',
  Telangana: '36',
  Haryana: '06',
  'Tamil Nadu': '33',
  'Uttar Pradesh': '09',
  'West Bengal': '19',
  Gujarat: '24',
  Rajasthan: '08',
  Delhi: '07',
  Kerala: '32',
  Punjab: '03',
  'Madhya Pradesh': '23',
  Goa: '30',
  Odisha: '21',
};

export const PRODUCT_CATALOG_TEMPLATES = [
  // Category 1: Laptops & Workstations (HARDWARE, 18% tax, max 20% discount)
  { cat: 'cat_001', name: 'ApexBook Pro 16" Workstation', sku: 'DEMO-NB-APEX16', type: 'HARDWARE', basePrice: 185000, costPrice: 135000, taxPercent: 18 },
  { cat: 'cat_001', name: 'ApexBook Air 14" Ultralight', sku: 'DEMO-NB-APEX14', type: 'HARDWARE', basePrice: 125000, costPrice: 92000, taxPercent: 18 },
  { cat: 'cat_001', name: 'TitanDesk Enterprise Workstation', sku: 'DEMO-WS-TITAN', type: 'HARDWARE', basePrice: 245000, costPrice: 180000, taxPercent: 18 },
  { cat: 'cat_001', name: 'TitanMini Compact Client PC', sku: 'DEMO-WS-MINI', type: 'HARDWARE', basePrice: 65000, costPrice: 48000, taxPercent: 18 },
  { cat: 'cat_001', name: 'DevPro Developer Studio Laptop', sku: 'DEMO-NB-DEV15', type: 'HARDWARE', basePrice: 155000, costPrice: 115000, taxPercent: 18 },
  { cat: 'cat_001', name: 'FieldTough Rugged Tablet PC', sku: 'DEMO-TB-RUG01', type: 'HARDWARE', basePrice: 95000, costPrice: 72000, taxPercent: 18 },
  { cat: 'cat_001', name: 'EcoBook Student Series Laptop', sku: 'DEMO-NB-ECO13', type: 'HARDWARE', basePrice: 45000, costPrice: 38000, taxPercent: 18 },
  { cat: 'cat_001', name: 'ApexBook Creator 4K Edition', sku: 'DEMO-NB-APX4K', type: 'HARDWARE', basePrice: 220000, costPrice: 165000, taxPercent: 18 },
  { cat: 'cat_001', name: 'ThinNode Silent Micro Desktop', sku: 'DEMO-WS-THIN1', type: 'HARDWARE', basePrice: 38000, costPrice: 31000, taxPercent: 18 },
  { cat: 'cat_001', name: 'QuantumBook Dual-Screen Laptop', sku: 'DEMO-NB-QDUAL', type: 'HARDWARE', basePrice: 280000, costPrice: 210000, taxPercent: 18 },

  // Category 2: Enterprise Servers (HARDWARE, 18% tax, max 15% discount)
  { cat: 'cat_002', name: 'ServerGrid 2U Dual Xeon Node', sku: 'DEMO-SRV-2U900', type: 'HARDWARE', basePrice: 420000, costPrice: 320000, taxPercent: 18 },
  { cat: 'cat_002', name: 'ServerGrid 1U High-Density Rack', sku: 'DEMO-SRV-1U500', type: 'HARDWARE', basePrice: 290000, costPrice: 225000, taxPercent: 18 },
  { cat: 'cat_002', name: 'ServerGrid 4U Storage Array Server', sku: 'DEMO-SRV-4USTOR', type: 'HARDWARE', basePrice: 680000, costPrice: 510000, taxPercent: 18 },
  { cat: 'cat_002', name: 'ServerGrid Edge AI Inferencing Node', sku: 'DEMO-SRV-EDGEAI', type: 'HARDWARE', basePrice: 540000, costPrice: 410000, taxPercent: 18 },
  { cat: 'cat_002', name: 'TowerGrid Small Office Server', sku: 'DEMO-SRV-TOW01', type: 'HARDWARE', basePrice: 160000, costPrice: 125000, taxPercent: 18 },
  { cat: 'cat_002', name: 'HyperGrid Blade Enclosure 8-Slot', sku: 'DEMO-SRV-BLADE8', type: 'HARDWARE', basePrice: 950000, costPrice: 740000, taxPercent: 18 },
  { cat: 'cat_002', name: 'HyperGrid Compute Blade Module', sku: 'DEMO-SRV-BLADEC', type: 'HARDWARE', basePrice: 310000, costPrice: 240000, taxPercent: 18 },
  { cat: 'cat_002', name: 'UltraGrid Database Accelerator Server', sku: 'DEMO-SRV-DBACC', type: 'HARDWARE', basePrice: 820000, costPrice: 630000, taxPercent: 18 },
  { cat: 'cat_002', name: 'BackupGrid LTO Tape Automation Hub', sku: 'DEMO-SRV-TAPE01', type: 'HARDWARE', basePrice: 380000, costPrice: 295000, taxPercent: 18 },
  { cat: 'cat_002', name: 'ServerGrid Cloud Gateway Server', sku: 'DEMO-SRV-GWY01', type: 'HARDWARE', basePrice: 210000, costPrice: 165000, taxPercent: 18 },

  // Category 3: Networking Hardware (HARDWARE, 18% tax, max 15% discount)
  { cat: 'cat_003', name: 'NetCore 48-Port 10G Managed Switch', sku: 'DEMO-NET-SW4810', type: 'HARDWARE', basePrice: 145000, costPrice: 110000, taxPercent: 18 },
  { cat: 'cat_003', name: 'NetCore 24-Port PoE+ Access Switch', sku: 'DEMO-NET-SW24POE', type: 'HARDWARE', basePrice: 85000, costPrice: 64000, taxPercent: 18 },
  { cat: 'cat_003', name: 'NetCore Enterprise Core Router 100G', sku: 'DEMO-NET-RTR100', type: 'HARDWARE', basePrice: 480000, costPrice: 370000, taxPercent: 18 },
  { cat: 'cat_003', name: 'SecureWave NextGen Security Gateway', sku: 'DEMO-NET-FWNG01', type: 'HARDWARE', basePrice: 260000, costPrice: 195000, taxPercent: 18 },
  { cat: 'cat_003', name: 'AirLink Wi-Fi 7 Enterprise AP', sku: 'DEMO-NET-APWIFI7', type: 'HARDWARE', basePrice: 38000, costPrice: 28000, taxPercent: 18 },
  { cat: 'cat_003', name: 'AirLink Outdoor Long-Range Mesh AP', sku: 'DEMO-NET-APOUT01', type: 'HARDWARE', basePrice: 48000, costPrice: 36000, taxPercent: 18 },
  { cat: 'cat_003', name: 'FiberLink 16-Port SFP+ Aggregator', sku: 'DEMO-NET-FBR16', type: 'HARDWARE', basePrice: 195000, costPrice: 150000, taxPercent: 18 },
  { cat: 'cat_003', name: 'VPNShield Branch Edge Appliance', sku: 'DEMO-NET-VPNEDG', type: 'HARDWARE', basePrice: 72000, costPrice: 55000, taxPercent: 18 },
  { cat: 'cat_003', name: 'NetCore 8-Port Industrial Rugged Switch', sku: 'DEMO-NET-SWIND8', type: 'HARDWARE', basePrice: 58000, costPrice: 44000, taxPercent: 18 },
  { cat: 'cat_003', name: 'RackPower Smart Switched PDU 30A', sku: 'DEMO-NET-PDU30', type: 'HARDWARE', basePrice: 42000, costPrice: 31000, taxPercent: 18 },

  // Category 4: Office Peripherals (HARDWARE, 18% tax, max 25% discount)
  { cat: 'cat_004', name: 'VisionPro 34" Curved WQHD Monitor', sku: 'DEMO-MON-34CRV', type: 'HARDWARE', basePrice: 62000, costPrice: 46000, taxPercent: 18 },
  { cat: 'cat_004', name: 'VisionPro 27" 4K Color-Accurate Display', sku: 'DEMO-MON-274K', type: 'HARDWARE', basePrice: 48000, costPrice: 36000, taxPercent: 18 },
  { cat: 'cat_004', name: 'OmniDock Thunderbolt 4 Docking Station', sku: 'DEMO-DK-TB401', type: 'HARDWARE', basePrice: 24000, costPrice: 17500, taxPercent: 18 },
  { cat: 'cat_004', name: 'ErgoKey Wireless Split Keyboard Combo', sku: 'DEMO-KB-ERGOW', type: 'HARDWARE', basePrice: 14000, costPrice: 9800, taxPercent: 18 },
  { cat: 'cat_004', name: 'LaserPrint Enterprise Multi-Function MFP', sku: 'DEMO-PRN-MFP01', type: 'HARDWARE', basePrice: 110000, costPrice: 84000, taxPercent: 18 },
  { cat: 'cat_004', name: 'ConferenceCam 4K PTZ Room System', sku: 'DEMO-AV-CAM4K', type: 'HARDWARE', basePrice: 89000, costPrice: 67000, taxPercent: 18 },
  { cat: 'cat_004', name: 'BeamVoice Acoustic Speakerphone Hub', sku: 'DEMO-AV-SPK01', type: 'HARDWARE', basePrice: 29000, costPrice: 21000, taxPercent: 18 },
  { cat: 'cat_004', name: 'DocuScan High-Speed Duplex Scanner', sku: 'DEMO-SC-DUP100', type: 'HARDWARE', basePrice: 52000, costPrice: 39000, taxPercent: 18 },
  { cat: 'cat_004', name: 'SafePower Online UPS 3000VA Rackmount', sku: 'DEMO-UPS-3000', type: 'HARDWARE', basePrice: 78000, costPrice: 59000, taxPercent: 18 },
  { cat: 'cat_004', name: 'ThinMargin Low-Cost Peripheral Bundle', sku: 'DEMO-PER-THIN01', type: 'HARDWARE', basePrice: 12000, costPrice: 11400, taxPercent: 18 }, // Thin margin (5%)

  // Category 5: Cloud Infrastructure & SaaS (SUBSCRIPTION, 18% tax, max 12% discount)
  { cat: 'cat_005', name: 'CloudVPC Dedicated Virtual Private Cloud', sku: 'DEMO-SUB-VPC01', type: 'SUBSCRIPTION', basePrice: 45000, costPrice: 28000, taxPercent: 18 },
  { cat: 'cat_005', name: 'DataLake Managed Analytics Workspace', sku: 'DEMO-SUB-DLAKE', type: 'SUBSCRIPTION', basePrice: 65000, costPrice: 42000, taxPercent: 18 },
  { cat: 'cat_005', name: 'SecureID Single Sign-On 500-Seat Pack', sku: 'DEMO-SUB-SSO500', type: 'SUBSCRIPTION', basePrice: 32000, costPrice: 19000, taxPercent: 18 },
  { cat: 'cat_005', name: 'BackupVault Encrypted S3-Compatible Cloud', sku: 'DEMO-SUB-BKP10T', type: 'SUBSCRIPTION', basePrice: 28000, costPrice: 16000, taxPercent: 18 },
  { cat: 'cat_005', name: 'AI-Ops Continuous Log Monitoring Suite', sku: 'DEMO-SUB-AIOPS', type: 'SUBSCRIPTION', basePrice: 58000, costPrice: 36000, taxPercent: 18 },
  { cat: 'cat_005', name: 'API Gateway Dedicated Cluster License', sku: 'DEMO-SUB-APIGW', type: 'SUBSCRIPTION', basePrice: 42000, costPrice: 26000, taxPercent: 18 },
  { cat: 'cat_005', name: 'Kubernetes Container Mesh Enterprise', sku: 'DEMO-SUB-K8SMSH', type: 'SUBSCRIPTION', basePrice: 75000, costPrice: 48000, taxPercent: 18 },
  { cat: 'cat_005', name: 'ZeroTrust Endpoint Protection 250-Seat', sku: 'DEMO-SUB-ZTR250', type: 'SUBSCRIPTION', basePrice: 38000, costPrice: 23000, taxPercent: 18 },
  { cat: 'cat_005', name: 'DevPipeline CI/CD Runner Farm 20x', sku: 'DEMO-SUB-CICD20', type: 'SUBSCRIPTION', basePrice: 25000, costPrice: 15000, taxPercent: 18 },
  { cat: 'cat_005', name: 'EdgeCDN Global Traffic Acceleration', sku: 'DEMO-SUB-CDNGLO', type: 'SUBSCRIPTION', basePrice: 35000, costPrice: 21000, taxPercent: 18 },

  // Category 6: Managed Support Plans & Services (SERVICE, 18% tax, max 10% discount)
  { cat: 'cat_006', name: '24x7 Mission-Critical TAM Support Plan', sku: 'DEMO-SRV-TAM247', type: 'SERVICE', basePrice: 120000, costPrice: 75000, taxPercent: 18 },
  { cat: 'cat_006', name: 'Architecture Review & Optimization Audit', sku: 'DEMO-SRV-ARCHREV', type: 'SERVICE', basePrice: 85000, costPrice: 50000, taxPercent: 18 },
  { cat: 'cat_006', name: 'On-Site Hardware Installation & Tuning', sku: 'DEMO-SRV-INSTON', type: 'SERVICE', basePrice: 45000, costPrice: 30000, taxPercent: 18 },
  { cat: 'cat_006', name: 'Cybersecurity Penetration Test & Audit', sku: 'DEMO-SRV-PENTEST', type: 'SERVICE', basePrice: 160000, costPrice: 95000, taxPercent: 18 },
  { cat: 'cat_006', name: 'Cloud Migration Factory Sprint (2 Wks)', sku: 'DEMO-SRV-MIGSPR', type: 'SERVICE', basePrice: 250000, costPrice: 160000, taxPercent: 18 },
  { cat: 'cat_006', name: 'Disaster Recovery Warm-Site Readiness Drill', sku: 'DEMO-SRV-DRDRILL', type: 'SERVICE', basePrice: 110000, costPrice: 70000, taxPercent: 18 },
  { cat: 'cat_006', name: 'Custom ERP Connector Development Sprint', sku: 'DEMO-SRV-ERPCONN', type: 'SERVICE', basePrice: 195000, costPrice: 125000, taxPercent: 18 },
  { cat: 'cat_006', name: 'DevOps Automation & IaC Blueprint Setup', sku: 'DEMO-SRV-IACBLUE', type: 'SERVICE', basePrice: 140000, costPrice: 85000, taxPercent: 18 },
  { cat: 'cat_006', name: 'Legacy System Modernization Assessment', sku: 'DEMO-SRV-LEGASS', type: 'SERVICE', basePrice: 95000, costPrice: 60000, taxPercent: 18 },
  { cat: 'cat_006', name: 'Quarterly Executive Technology Business Review', sku: 'DEMO-SRV-QBRREV', type: 'SERVICE', basePrice: 50000, costPrice: 32000, taxPercent: 18 },
];

