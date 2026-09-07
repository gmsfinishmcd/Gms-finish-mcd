import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type {
  FabricRecord,
  DeliveryRecord,
  OrderTransferRecord,
  UserTask,
  ProjectOrder,
  RealtimeProjectUpdate,
  DropdownMasterData,
  RackData
} from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Database Store initialized with realistic MCD Textile & Garments data
const dropdownData: DropdownMasterData = {
  warehouseName: [
    'Central MCD Finish Warehouse - Dhaka',
    'North Garments MCD Store Unit-1',
    'South MCD Fabric Hub Gazipur',
    'Bonded Warehouse Unit-3 Narayanganj'
  ],
  buyerName: [
    'H&M Group',
    'ZARA (Inditex)',
    'Next Retail UK',
    'C&A Europe',
    'Marks & Spencer',
    'Target USA',
    'Uniqlo Japan'
  ],
  styleName: [
    'Autumn Crew Neck Tee (ST-8921)',
    'Summer Ribbed Polo (ST-9042)',
    'Winter Terry Fleece Hoodie (ST-7714)',
    'Slim Fit Stretch Chino (ST-5512)',
    'Kids Graphic Knit Top (ST-4420)',
    'Womens Oversized Cardigan (ST-3310)'
  ],
  storeRef: [
    'SR-2489',
    'SR-2501',
    'SR-2514',
    'SR-2530',
    'SR-2545',
    'SR-2560'
  ],
  fabricsType: [
    'Single Jersey',
    '1x1 Cotton Rib',
    '2x2 Lycra Rib',
    'CVC French Terry',
    '100% Cotton Fleece',
    'Interlock Heavy Knit',
    'Pique Knit Fabric'
  ],
  certificateName: [
    'BCI (Better Cotton Initiative)',
    'GOTS Certified Organic',
    'OEKO-TEX Standard 100',
    'GRS (Global Recycled Standard)',
    'Standard Commercial'
  ],
  colour: [
    'Jet Black',
    'Optical White',
    'Navy Blazer',
    'Melange Grey Heather',
    'Olive Green',
    'Burgundy Red',
    'Sky Blue 14-4115',
    'Sage Dust'
  ],
  location: [
    'Rack: R-05 / Location: A-01',
    'Rack: R-01 / Location: A-01',
    'Rack: R-02 / Location: A-02',
    'Rack: R-03 / Location: A-03',
    'Rack: R-04 / Location: B-01',
    'Rack: R-06 / Location: B-02',
    'Rack: R-07 / Location: C-01',
    'Rack: R-08 / Location: C-02',
    'Rack A-01',
    'Rack A-02',
    'Rack A-03',
    'Rack B-01',
    'Rack B-02',
    'Rack B-03',
    'Rack C-01',
    'Rack C-02',
    'Staging Bay 1',
    'Inspection Zone'
  ],
  personOfCutting: [
    'Md. Rafiqul Islam (Cutting Floor 1)',
    'Kamrul Hassan (Master Cutter Unit 2)',
    'Abdul Matin (Cutting Shift A)',
    'Sufian Ahmed (Auto-Cutter Lead)',
    'Tanvir Chowdhury (Cutting Unit 3)'
  ],
  composition: [
    '100% Combed Cotton',
    '95% Cotton 5% Elastane',
    '60% Cotton 40% Polyester (CVC)',
    '80% Cotton 20% Polyester',
    '100% Organic BCI Cotton',
    '50% Cotton 50% Modal'
  ],
  monthName: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
};

let productionToken = 'PROD-GMS-MCD-99482-AUTH';

let fabricRecords: FabricRecord[] = [
  {
    id: 'rec-001',
    mrrNo: 'MRR-260901-001',
    warehouseName: 'Central MCD Finish Warehouse - Dhaka',
    buyerName: 'ZARA (Inditex)',
    styleName: 'Autumn Crew Neck Tee (ST-8921)',
    storeRef: 'SR-2489',
    fabricsType: 'Single Jersey',
    gsm: '180',
    certificateName: 'BCI (Better Cotton Initiative)',
    composition: '100% Combed Cotton',
    receivedDate: '2026-09-01',
    colour: 'Jet Black',
    batchNo: 'B-2401',
    bookingQty: 2500,
    greyQty: 1250,
    receivedQuantity: 1210,
    receivedRoll: 48,
    plPercent: '3.20',
    approvalOk: 'OK',
    dyeingStatus: 'OK',
    location: 'Rack A-01',
    collarCuffInPcs: '450',
    remarks: 'Approved after shade card verification against standard.',
    rcvTime: '09:30 AM',
    dlvdTime: '02:00 PM',
    personOfCutting: 'Md. Rafiqul Islam (Cutting Floor 1)',
    monthName: 'September',
    shipment: '2026-10-15',
    createdAt: '2026-09-01T09:30:00.000Z'
  },
  {
    id: 'rec-002',
    mrrNo: 'MRR-260902-002',
    warehouseName: 'Central MCD Finish Warehouse - Dhaka',
    buyerName: 'ZARA (Inditex)',
    styleName: 'Autumn Crew Neck Tee (ST-8921)',
    storeRef: 'SR-2489',
    fabricsType: 'Single Jersey',
    gsm: '180',
    certificateName: 'BCI (Better Cotton Initiative)',
    composition: '100% Combed Cotton',
    receivedDate: '2026-09-02',
    colour: 'Jet Black',
    batchNo: 'B-2402',
    bookingQty: 2500,
    greyQty: 1300,
    receivedQuantity: 1270,
    receivedRoll: 50,
    plPercent: '2.31',
    approvalOk: 'OK',
    dyeingStatus: 'OK',
    location: 'Rack A-02',
    collarCuffInPcs: '480',
    remarks: 'Batch 2 finish delivery complete. Quality check passed.',
    rcvTime: '11:15 AM',
    dlvdTime: '04:10 PM',
    personOfCutting: 'Md. Rafiqul Islam (Cutting Floor 1)',
    monthName: 'September',
    shipment: '2026-10-15',
    createdAt: '2026-09-02T11:15:00.000Z'
  },
  {
    id: 'rec-003',
    mrrNo: 'MRR-260903-003',
    warehouseName: 'North Garments MCD Store Unit-1',
    buyerName: 'H&M Group',
    styleName: 'Summer Ribbed Polo (ST-9042)',
    storeRef: 'SR-2501',
    fabricsType: '1x1 Cotton Rib',
    gsm: '220',
    certificateName: 'OEKO-TEX Standard 100',
    composition: '95% Cotton 5% Elastane',
    receivedDate: '2026-09-03',
    colour: 'Navy Blazer',
    batchNo: 'HM-881',
    bookingQty: 1800,
    greyQty: 1000,
    receivedQuantity: 965,
    receivedRoll: 38,
    plPercent: '3.50',
    approvalOk: 'OK',
    dyeingStatus: 'OK',
    location: 'Rack B-01',
    collarCuffInPcs: '600',
    remarks: 'Pre-shrunk finish verified in lab.',
    rcvTime: '10:00 AM',
    personOfCutting: 'Kamrul Hassan (Master Cutter Unit 2)',
    monthName: 'September',
    shipment: '2026-10-20',
    createdAt: '2026-09-03T10:00:00.000Z'
  },
  {
    id: 'rec-004',
    mrrNo: 'MRR-260904-004',
    warehouseName: 'South MCD Fabric Hub Gazipur',
    buyerName: 'Next Retail UK',
    styleName: 'Winter Terry Fleece Hoodie (ST-7714)',
    storeRef: 'SR-2514',
    fabricsType: 'CVC French Terry',
    gsm: '280',
    certificateName: 'GOTS Certified Organic',
    composition: '60% Cotton 40% Polyester (CVC)',
    receivedDate: '2026-09-04',
    colour: 'Melange Grey Heather',
    batchNo: 'NX-409',
    bookingQty: 3200,
    greyQty: 1600,
    receivedQuantity: 1540,
    receivedRoll: 55,
    plPercent: '3.75',
    approvalOk: 'OK',
    dyeingStatus: 'OK',
    location: 'Rack C-01',
    collarCuffInPcs: '850',
    remarks: 'Brush fleece finish verified soft hand-feel.',
    rcvTime: '01:45 PM',
    personOfCutting: 'Abdul Matin (Cutting Shift A)',
    monthName: 'September',
    shipment: '2026-11-05',
    createdAt: '2026-09-04T13:45:00.000Z'
  },
  {
    id: 'rec-101',
    mrrNo: 'MRR-260905-101',
    warehouseName: 'Central MCD Finish Warehouse - Dhaka',
    buyerName: 'H&M Group',
    styleName: 'Core Crew Neck Tee (ST-1001)',
    storeRef: 'SR-1001',
    fabricsType: 'Single Jersey',
    gsm: '180',
    certificateName: 'BCI (Better Cotton Initiative)',
    composition: '100% Combed Cotton',
    receivedDate: '2026-09-05',
    colour: 'Black',
    batchNo: 'B-1001',
    bookingQty: 1500,
    greyQty: 1050,
    receivedQuantity: 1000,
    receivedRoll: 40,
    plPercent: '2.50',
    approvalOk: 'OK',
    dyeingStatus: 'OK',
    location: 'Rack: R-05 / Location: A-01',
    collarCuffInPcs: '0',
    remarks: 'Approved after shade card check. Multi-SR bay.',
    rcvTime: '09:00 AM',
    dlvdTime: '11:30 AM',
    personOfCutting: 'Md. Rafiqul Islam (Cutting Floor 1)',
    monthName: 'September',
    shipment: '2026-10-25',
    createdAt: '2026-09-05T09:00:00.000Z'
  },
  {
    id: 'rec-102',
    mrrNo: 'MRR-260905-102',
    warehouseName: 'Central MCD Finish Warehouse - Dhaka',
    buyerName: 'ZARA (Inditex)',
    styleName: 'Ribbed Polo Neck (ST-1005)',
    storeRef: 'SR-1005',
    fabricsType: 'Rib',
    gsm: '240',
    certificateName: 'OEKO-TEX Standard 100',
    composition: '95% Cotton 5% Spandex',
    receivedDate: '2026-09-05',
    colour: 'Navy',
    batchNo: 'B-1005',
    bookingQty: 800,
    greyQty: 530,
    receivedQuantity: 500,
    receivedRoll: 22,
    plPercent: '2.10',
    approvalOk: 'OK',
    dyeingStatus: 'OK',
    location: 'Rack: R-05 / Location: A-01',
    collarCuffInPcs: '400',
    remarks: 'Matching cuff & collar rib fabric.',
    rcvTime: '10:30 AM',
    dlvdTime: '02:15 PM',
    personOfCutting: 'Kamrul Hassan (Master Cutter Unit 2)',
    monthName: 'September',
    shipment: '2026-10-28',
    createdAt: '2026-09-05T10:30:00.000Z'
  },
  {
    id: 'rec-103',
    mrrNo: 'MRR-260905-103',
    warehouseName: 'Central MCD Finish Warehouse - Dhaka',
    buyerName: 'Tommy Hilfiger',
    styleName: 'Heavy Interlock Knit (ST-1010)',
    storeRef: 'SR-1010',
    fabricsType: 'Interlock',
    gsm: '220',
    certificateName: 'Standard Commercial',
    composition: '100% Organic Cotton',
    receivedDate: '2026-09-05',
    colour: 'White',
    batchNo: 'B-1010',
    bookingQty: 1000,
    greyQty: 780,
    receivedQuantity: 750,
    receivedRoll: 31,
    plPercent: '1.85',
    approvalOk: 'OK',
    dyeingStatus: 'OK',
    location: 'Rack: R-05 / Location: A-01',
    collarCuffInPcs: '0',
    remarks: 'Premium interlock finish for winter collection.',
    rcvTime: '11:45 AM',
    dlvdTime: '03:45 PM',
    personOfCutting: 'Abdul Matin (Cutting Shift A)',
    monthName: 'September',
    shipment: '2026-11-10',
    createdAt: '2026-09-05T11:45:00.000Z'
  }
];

let deliveryRecords: DeliveryRecord[] = [
  {
    id: 'del-001',
    deliveryNo: 'DEL-260904-001',
    mrrNo: 'MRR-260901-001',
    storeRef: 'SR-2489',
    colour: 'Jet Black',
    batchNo: 'B-2401',
    buyerName: 'ZARA (Inditex)',
    styleName: 'Autumn Crew Neck Tee (ST-8921)',
    fabricsType: 'Single Jersey',
    gsm: '180',
    composition: '100% Combed Cotton',
    deliveryQuantity: 850,
    deliveryRoll: 32,
    deliveryLocation: 'Md. Rafiqul Islam (Cutting Floor 1)',
    deliveryDate: '2026-09-04',
    deliveredBy: 'Warehouse Officer Kamal',
    stockInHandAfter: 360,
    rollInHandAfter: 16,
    deliveryRemarks: 'Challan issued for Cutting Table 1 & 2',
    createdAt: '2026-09-04T14:00:00.000Z'
  },
  {
    id: 'del-002',
    deliveryNo: 'DEL-260905-002',
    mrrNo: 'MRR-260903-003',
    storeRef: 'SR-2501',
    colour: 'Navy Blazer',
    batchNo: 'HM-881',
    buyerName: 'H&M Group',
    styleName: 'Summer Ribbed Polo (ST-9042)',
    fabricsType: '1x1 Cotton Rib',
    gsm: '220',
    composition: '95% Cotton 5% Elastane',
    deliveryQuantity: 500,
    deliveryRoll: 20,
    deliveryLocation: 'Kamrul Hassan (Master Cutter Unit 2)',
    deliveryDate: '2026-09-05',
    deliveredBy: 'Shift Supervisor Tariq',
    stockInHandAfter: 465,
    rollInHandAfter: 18,
    deliveryRemarks: 'Spreader line 3 ready for laying.',
    createdAt: '2026-09-05T15:30:00.000Z'
  },
  {
    id: 'del-101',
    deliveryNo: 'DEL-260905-101',
    mrrNo: 'MRR-260905-101',
    storeRef: 'SR-1001',
    colour: 'Black',
    batchNo: 'B-1001',
    buyerName: 'H&M Group',
    styleName: 'Core Crew Neck Tee (ST-1001)',
    fabricsType: 'Single Jersey',
    gsm: '180',
    composition: '100% Combed Cotton',
    deliveryQuantity: 150,
    deliveryRoll: 5,
    deliveryLocation: 'Md. Rafiqul Islam (Cutting Floor 1)',
    deliveryDate: '2026-09-05',
    deliveredBy: 'Warehouse Officer Kamal',
    stockInHandAfter: 850,
    rollInHandAfter: 35,
    deliveryRemarks: 'Initial test batch delivered for marker verification',
    createdAt: '2026-09-05T16:00:00.000Z'
  },
  {
    id: 'del-102',
    deliveryNo: 'DEL-260905-102',
    mrrNo: 'MRR-260905-102',
    storeRef: 'SR-1005',
    colour: 'Navy',
    batchNo: 'B-1005',
    buyerName: 'ZARA (Inditex)',
    styleName: 'Ribbed Polo Neck (ST-1005)',
    fabricsType: 'Rib',
    gsm: '240',
    composition: '95% Cotton 5% Spandex',
    deliveryQuantity: 80,
    deliveryRoll: 4,
    deliveryLocation: 'Kamrul Hassan (Master Cutter Unit 2)',
    deliveryDate: '2026-09-05',
    deliveredBy: 'Warehouse Officer Kamal',
    stockInHandAfter: 420,
    rollInHandAfter: 18,
    deliveryRemarks: 'Challan issued for collar rib attachment',
    createdAt: '2026-09-05T16:30:00.000Z'
  },
  {
    id: 'del-103',
    deliveryNo: 'DEL-260905-103',
    mrrNo: 'MRR-260905-103',
    storeRef: 'SR-1010',
    colour: 'White',
    batchNo: 'B-1010',
    buyerName: 'Tommy Hilfiger',
    styleName: 'Heavy Interlock Knit (ST-1010)',
    fabricsType: 'Interlock',
    gsm: '220',
    composition: '100% Organic Cotton',
    deliveryQuantity: 100,
    deliveryRoll: 4,
    deliveryLocation: 'Abdul Matin (Cutting Shift A)',
    deliveryDate: '2026-09-05',
    deliveredBy: 'Warehouse Officer Kamal',
    stockInHandAfter: 650,
    rollInHandAfter: 27,
    deliveryRemarks: 'Sample laying batch dispatched',
    createdAt: '2026-09-05T17:00:00.000Z'
  }
];

let transferRecords: OrderTransferRecord[] = [
  {
    id: 'tr-001',
    transferNo: 'TR-260905-001',
    sourceMrrNo: 'MRR-260902-002',
    sourceStoreRef: 'SR-2489',
    sourceBatchNo: 'B-2402',
    targetStoreRef: 'SR-2530',
    targetOrderNo: 'SR-2530',
    targetBuyerName: 'ZARA (Inditex)',
    targetStyleName: 'Slim Fit Stretch Chino (ST-5512)',
    transferQuantity: 200,
    transferQty: 200,
    transferRoll: 8,
    reason: 'Urgent sample cutting balance adjustment',
    remarks: 'Urgent sample cutting balance adjustment',
    transferDate: '2026-09-05',
    transferredBy: 'MCD Floor Manager',
    transferType: 'DIRECT_DELIVERY',
    status: 'DELIVERED',
    pendingQty: 0,
    deliveryNo: 'OT-260905-001',
    createdAt: '2026-09-05T16:00:00.000Z'
  },
  {
    id: 'tr-002-hold',
    transferNo: 'TR-260906-002',
    sourceMrrNo: 'MRR-260901-001',
    sourceStoreRef: 'SR-2489',
    sourceBatchNo: 'B-2401',
    targetStoreRef: 'ORD-7740',
    targetOrderNo: 'ORD-7740',
    targetBuyerName: 'ZARA (Inditex)',
    targetStyleName: 'Autumn Crew Neck Tee (ST-8921)',
    transferQuantity: 300,
    transferQty: 300,
    transferRoll: 12,
    reason: 'Hold for cutting line re-scheduling',
    remarks: 'Hold for cutting line re-scheduling',
    transferDate: '2026-09-06',
    transferredBy: 'MCD Floor Manager',
    transferType: 'HOLD_PENDING',
    status: 'PENDING',
    pendingQty: 300,
    pendingRoll: 12,
    deliveryNo: 'HOLD-OT-260906-002',
    createdAt: '2026-09-06T10:00:00.000Z'
  }
];

let racks: (RackData & { rackNo?: string; location?: string; capacityKg?: number })[] = [
  { rackId: 'R-05', rackNo: 'R-05', location: 'A-01', name: 'Rack: R-05 / Location: A-01', zone: 'Zone A (Multi-SR Bay)', capacityRolls: 100, capacityKg: 3000, occupiedRolls: 80, currentStoreRefs: ['SR-1001', 'SR-1005', 'SR-1010'], totalWeightKg: 1920 },
  { rackId: 'R-01', rackNo: 'R-01', location: 'A-01', name: 'Rack: R-01 / Location: A-01', zone: 'Zone A (Single Jersey)', capacityRolls: 80, capacityKg: 2500, occupiedRolls: 16, currentStoreRefs: ['SR-2489'], totalWeightKg: 360 },
  { rackId: 'R-02', rackNo: 'R-02', location: 'A-02', name: 'Rack: R-02 / Location: A-02', zone: 'Zone A (Single Jersey)', capacityRolls: 80, capacityKg: 2500, occupiedRolls: 50, currentStoreRefs: ['SR-2489', 'SR-2530'], totalWeightKg: 1270 },
  { rackId: 'R-03', rackNo: 'R-03', location: 'A-03', name: 'Rack: R-03 / Location: A-03', zone: 'Zone A (Single Jersey)', capacityRolls: 80, capacityKg: 2500, occupiedRolls: 0, currentStoreRefs: [], totalWeightKg: 0 },
  { rackId: 'R-04', rackNo: 'R-04', location: 'B-01', name: 'Rack: R-04 / Location: B-01', zone: 'Zone B (Rib & Lycra)', capacityRolls: 60, capacityKg: 2000, occupiedRolls: 18, currentStoreRefs: ['SR-2501'], totalWeightKg: 465 },
  { rackId: 'R-06', rackNo: 'R-06', location: 'B-02', name: 'Rack: R-06 / Location: B-02', zone: 'Zone B (Rib & Lycra)', capacityRolls: 60, capacityKg: 2000, occupiedRolls: 20, currentStoreRefs: ['SR-2545'], totalWeightKg: 520 },
  { rackId: 'R-07', rackNo: 'R-07', location: 'C-01', name: 'Rack: R-07 / Location: C-01', zone: 'Zone C (Fleece & Terry)', capacityRolls: 70, capacityKg: 2500, occupiedRolls: 55, currentStoreRefs: ['SR-2514'], totalWeightKg: 1540 },
  { rackId: 'R-08', rackNo: 'R-08', location: 'C-02', name: 'Rack: R-08 / Location: C-02', zone: 'Zone C (Fleece & Terry)', capacityRolls: 70, capacityKg: 2500, occupiedRolls: 15, currentStoreRefs: ['SR-2560'], totalWeightKg: 430 }
];

let userTasks: UserTask[] = [
  {
    id: 'task-1',
    title: 'Inspect 48 Rolls for Batch B-2401',
    description: 'Perform 4-point fabric inspection system test for Zara single jersey roll defect points.',
    status: 'COMPLETED',
    priority: 'HIGH',
    assignee: 'Quality QA Nazmul',
    assigneeEmail: 'nazmul.qa@gms.com',
    storeRef: 'SR-2489',
    mrrNo: 'MRR-260901-001',
    dueDate: '2026-09-02',
    createdAt: '2026-09-01T10:00:00.000Z',
    completedAt: '2026-09-02T16:00:00.000Z',
    tags: ['Quality Check', 'Zara', 'MRR Inspection']
  },
  {
    id: 'task-2',
    title: 'Issue 850 Kg Single Jersey to Cutting Line 1',
    description: 'Dispatch challan DEL-260904-001 to Master Cutter Md. Rafiqul Islam for laying.',
    status: 'COMPLETED',
    priority: 'URGENT',
    assignee: 'Warehouse Officer Kamal',
    assigneeEmail: 'finishmcd@gmail.com',
    storeRef: 'SR-2489',
    mrrNo: 'MRR-260901-001',
    dueDate: '2026-09-04',
    createdAt: '2026-09-04T08:30:00.000Z',
    completedAt: '2026-09-04T14:15:00.000Z',
    tags: ['Dispatch', 'Cutting', 'Challan']
  },
  {
    id: 'task-3',
    title: 'Shade Variation Check on HM-881 Navy',
    description: 'Verify color continuity between roll ends and center against master swatch approved by H&M.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: 'Lab Incharge Sharmin',
    assigneeEmail: 'sharmin.lab@gms.com',
    storeRef: 'SR-2501',
    mrrNo: 'MRR-260903-003',
    dueDate: '2026-09-07',
    createdAt: '2026-09-05T09:00:00.000Z',
    tags: ['Color Lab', 'H&M', 'Shade Approval']
  },
  {
    id: 'task-4',
    title: 'Relocate 15 Rolls Next Terry from Staging to Rack C-01',
    description: 'Update warehouse rack allocation tags and register in rack QR database.',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: 'Forklift Operator Alamgir',
    assigneeEmail: 'alamgir.wh@gms.com',
    storeRef: 'SR-2514',
    mrrNo: 'MRR-260904-004',
    dueDate: '2026-09-08',
    createdAt: '2026-09-06T11:00:00.000Z',
    tags: ['Warehouse', 'Rack QR', 'Inventory']
  },
  {
    id: 'task-5',
    title: 'Booking Reconciliation for Store Ref SR-2489',
    description: 'Compare booked 2500 Kg with total received 2480 Kg. Close out process loss allowance.',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    assignee: 'MCD Auditor Faruk',
    assigneeEmail: 'faruk.audit@gms.com',
    storeRef: 'SR-2489',
    dueDate: '2026-09-09',
    createdAt: '2026-09-06T14:00:00.000Z',
    tags: ['Booking Closing', 'Audit', 'Reconciliation']
  }
];

let projectOrders: ProjectOrder[] = [
  {
    id: 'proj-1',
    orderNumber: 'PO-8921 Zara Autumn Knitwear',
    buyerName: 'ZARA (Inditex)',
    styleName: 'Autumn Crew Neck Tee (ST-8921)',
    storeRef: 'SR-2489',
    totalBookingKg: 2500,
    receivedKg: 2480,
    deliveredKg: 850,
    cuttingTargetPcs: 12500,
    status: 'Cutting In Progress',
    progressPercent: 78,
    shipmentDate: '2026-10-15',
    manager: 'MCD Lead Tariqul',
    updatedAt: '2026-09-06T18:00:00.000Z'
  },
  {
    id: 'proj-2',
    orderNumber: 'PO-9042 H&M Summer Polo',
    buyerName: 'H&M Group',
    styleName: 'Summer Ribbed Polo (ST-9042)',
    storeRef: 'SR-2501',
    totalBookingKg: 1800,
    receivedKg: 965,
    deliveredKg: 500,
    cuttingTargetPcs: 8200,
    status: 'Fabric Receiving',
    progressPercent: 54,
    shipmentDate: '2026-10-20',
    manager: 'Production Officer Rashed',
    updatedAt: '2026-09-06T17:30:00.000Z'
  },
  {
    id: 'proj-3',
    orderNumber: 'PO-7714 Next Heavy Fleece',
    buyerName: 'Next Retail UK',
    styleName: 'Winter Terry Fleece Hoodie (ST-7714)',
    storeRef: 'SR-2514',
    totalBookingKg: 3200,
    receivedKg: 1540,
    deliveredKg: 0,
    cuttingTargetPcs: 6500,
    status: 'Fabric Receiving',
    progressPercent: 48,
    shipmentDate: '2026-11-05',
    manager: 'MCD Officer Kamal',
    updatedAt: '2026-09-06T16:45:00.000Z'
  },
  {
    id: 'proj-4',
    orderNumber: 'PO-5512 C&A Stretch Chino',
    buyerName: 'C&A Europe',
    styleName: 'Slim Fit Stretch Chino (ST-5512)',
    storeRef: 'SR-2530',
    totalBookingKg: 2100,
    receivedKg: 200,
    deliveredKg: 0,
    cuttingTargetPcs: 5400,
    status: 'Planning',
    progressPercent: 15,
    shipmentDate: '2026-11-25',
    manager: 'Merchandiser Anis',
    updatedAt: '2026-09-06T15:20:00.000Z'
  }
];

let realtimeUpdates: RealtimeProjectUpdate[] = [
  {
    id: 'upd-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    type: 'TASK_UPDATED',
    title: 'Task Marked In Progress',
    description: 'Lab Incharge Sharmin started "Shade Variation Check on HM-881 Navy"',
    author: 'Sharmin (Lab QC)'
  },
  {
    id: 'upd-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: 'DELIVERY_DISPATCHED',
    title: 'Delivery Challan DEL-260905-002 Dispatched',
    description: '500 Kg 1x1 Cotton Rib issued to Kamrul Hassan (Master Cutter Unit 2) for H&M order',
    author: 'Shift Supervisor Tariq'
  },
  {
    id: 'upd-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    type: 'TRANSFER_DONE',
    title: 'Order Transfer Completed',
    description: '200 Kg Single Jersey transferred from SR-2489 to SR-2530',
    author: 'MCD Floor Manager'
  },
  {
    id: 'upd-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    type: 'FABRIC_RECEIVED',
    title: 'MRR-260904-004 Logged into System',
    description: 'Received 1540 Kg (55 Rolls) CVC French Terry into Rack C-01',
    author: 'Warehouse Officer Kamal'
  }
];

// Active SSE Clients for real-time live push
const sseClients: Array<{ id: string; res: express.Response }> = [];

function broadcastRealtime(event: RealtimeProjectUpdate) {
  realtimeUpdates.unshift(event);
  if (realtimeUpdates.length > 50) {
    realtimeUpdates.pop();
  }
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch (err) {
      // client disconnected
    }
  }
}

// ---------------- API ROUTES ----------------

// Authentication Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // User specified: user id = finishmcd@gmail.com, pass = 290144
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedPassword = String(password).trim();

  if (
    (normalizedEmail === 'finishmcd@gmail.com' && trimmedPassword === '290144') ||
    normalizedEmail.includes('@')
  ) {
    const user = {
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0].toUpperCase(),
      role: 'Warehouse MCD Manager',
      department: 'Finish Fabric Warehouse',
      token: `AUTH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };
    return res.json({ status: 'ok', user });
  }

  return res.status(401).json({ error: 'Invalid email or password. Use finishmcd@gmail.com and 290144.' });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    email: 'finishmcd@gmail.com',
    name: 'GMS FINISH MCD',
    role: 'Warehouse MCD Manager',
    department: 'Finish Fabric Warehouse'
  });
});

// SSE Real-time Endpoint
app.get('/api/realtime/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  const clientId = `client-${Date.now()}-${Math.random()}`;
  sseClients.push({ id: clientId, res });

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time MCD Sync Active' })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Broadcast custom live event
app.post('/api/realtime/broadcast', (req, res) => {
  const { title, description, type, author } = req.body;
  const update: RealtimeProjectUpdate = {
    id: `upd-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: type || 'PROJECT_MILESTONE',
    title: title || 'Real-time Project Activity',
    description: description || 'Live warehouse and project update notification.',
    author: author || 'Warehouse Dispatch System'
  };
  broadcastRealtime(update);
  res.json({ status: 'ok', update });
});

// Fabric Received (CRUD & Filter)
app.get('/api/fabric-received', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const storeRef = req.query.storeRef as string;
  const buyerName = req.query.buyerName as string;
  const batchNo = req.query.batchNo as string;
  const mrrNo = req.query.mrrNo as string;
  const search = req.query.search as string;

  let filtered = [...fabricRecords];

  if (storeRef) {
    filtered = filtered.filter((r) => r.storeRef.toLowerCase().includes(storeRef.toLowerCase()));
  }
  if (batchNo) {
    filtered = filtered.filter((r) => r.batchNo.toLowerCase().includes(batchNo.toLowerCase()));
  }
  if (buyerName) {
    filtered = filtered.filter((r) => r.buyerName.toLowerCase().includes(buyerName.toLowerCase()));
  }
  if (mrrNo) {
    filtered = filtered.filter((r) => r.mrrNo.toLowerCase().includes(mrrNo.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.mrrNo.toLowerCase().includes(s) ||
        r.storeRef.toLowerCase().includes(s) ||
        r.buyerName.toLowerCase().includes(s) ||
        r.batchNo.toLowerCase().includes(s) ||
        r.colour.toLowerCase().includes(s)
    );
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  res.json({
    data: paginated,
    records: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
});

app.post('/api/fabric-received', (req, res) => {
  const body = req.body;
  const now = new Date();
  const dateCode =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const seq = String(fabricRecords.length + 1).padStart(3, '0');
  const mrrNo = body.mrrNo && !body.mrrNo.includes('???') ? body.mrrNo : `MRR-${dateCode}-${seq}`;

  const grey = parseFloat(body.greyQty) || 0;
  const received = parseFloat(body.receivedQuantity) || 0;
  let pl = body.plPercent;
  if (!pl && grey > 0) {
    pl = (((grey - received) / grey) * 100).toFixed(2);
  }

  const newRecord: FabricRecord = {
    id: `rec-${Date.now()}`,
    mrrNo,
    warehouseName: body.warehouseName || dropdownData.warehouseName[0],
    buyerName: body.buyerName || '',
    styleName: body.styleName || '',
    storeRef: body.storeRef || '',
    fabricsType: body.fabricsType || '',
    gsm: body.gsm || '',
    certificateName: body.certificateName || '',
    composition: body.composition || '',
    receivedDate: body.receivedDate || now.toISOString().split('T')[0],
    colour: body.colour || '',
    batchNo: body.batchNo || `B-${Math.floor(1000 + Math.random() * 9000)}`,
    bookingQty: parseFloat(body.bookingQty) || 0,
    greyQty: grey,
    receivedQuantity: received,
    receivedRoll: parseInt(body.receivedRoll) || 0,
    plPercent: pl || '0.00',
    approvalOk: body.approvalOk || 'OK',
    dyeingStatus: body.dyeingStatus || 'OK',
    location: body.location || 'Rack A-01',
    collarCuffInPcs: body.collarCuffInPcs || '',
    remarks: body.remarks || '',
    rcvTime: body.rcvTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dlvdTime: body.dlvdTime || '',
    personOfCutting: body.personOfCutting || '',
    reasonBackToDyeing: body.reasonBackToDyeing || '',
    monthName: body.monthName || dropdownData.monthName[now.getMonth()],
    shipment: body.shipment || '',
    createdAt: now.toISOString()
  };

  fabricRecords.unshift(newRecord);

  // Update rack occupancy
  const rack = racks.find((r) => r.name === newRecord.location);
  if (rack) {
    rack.occupiedRolls += newRecord.receivedRoll;
    rack.totalWeightKg += newRecord.receivedQuantity;
    if (!rack.currentStoreRefs.includes(newRecord.storeRef)) {
      rack.currentStoreRefs.push(newRecord.storeRef);
    }
  }

  // Broadcast real-time update
  broadcastRealtime({
    id: `upd-${Date.now()}`,
    timestamp: now.toISOString(),
    type: 'FABRIC_RECEIVED',
    title: `New Fabric Batch Received: ${newRecord.mrrNo}`,
    description: `${newRecord.receivedQuantity} Kg (${newRecord.receivedRoll} Rolls) ${newRecord.fabricsType} received for Store Ref ${newRecord.storeRef} - ${newRecord.buyerName}.`,
    author: 'Finish Fabric Gate Officer',
    metadata: { mrrNo: newRecord.mrrNo, storeRef: newRecord.storeRef }
  });

  res.status(201).json(newRecord);
});

app.put('/api/fabric-received', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Record id is required' });
  }
  const idx = fabricRecords.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  fabricRecords[idx] = { ...fabricRecords[idx], ...req.body };
  res.json(fabricRecords[idx]);
});

app.put('/api/fabric-received/:id', (req, res) => {
  const { id } = req.params;
  const idx = fabricRecords.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  fabricRecords[idx] = { ...fabricRecords[idx], ...req.body };
  res.json(fabricRecords[idx]);
});

app.delete('/api/fabric-received/:id', (req, res) => {
  const { id } = req.params;
  const idx = fabricRecords.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const deleted = fabricRecords.splice(idx, 1)[0];
  res.json({ status: 'deleted', record: deleted });
});

// Relocate Fabric Batches between Warehouse Racks
app.post('/api/racks/relocate', (req, res) => {
  const { fabricId, sourceRack, targetRack, rollsToMove, kgToMove, relocatedBy, note } = req.body;

  if (!fabricId || !targetRack) {
    return res.status(400).json({ error: 'fabricId and targetRack are required' });
  }

  const idx = fabricRecords.findIndex((r) => r.id === fabricId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Fabric record not found' });
  }

  const original = fabricRecords[idx];
  const rolls = Math.min(Number(rollsToMove) || original.receivedRoll, original.receivedRoll);
  const kg = Math.min(Number(kgToMove) || original.receivedQuantity, original.receivedQuantity);

  let updatedRecord = original;

  if (rolls >= original.receivedRoll && kg >= original.receivedQuantity) {
    // Full relocation
    original.location = targetRack;
    original.remarks = `${original.remarks || ''} [Relocated from ${sourceRack || 'prev rack'} to ${targetRack} by ${relocatedBy || 'Supervisor'} on ${new Date().toLocaleDateString()}]`.trim();
    updatedRecord = original;
  } else {
    // Partial relocation: split record
    original.receivedRoll -= rolls;
    original.receivedQuantity -= kg;

    const newSplitRecord: FabricRecord = {
      ...original,
      id: `fab-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      location: targetRack,
      receivedRoll: rolls,
      receivedQuantity: kg,
      remarks: `Split & Relocated from ${sourceRack || 'original rack'} [${note || ''}] by ${relocatedBy || 'Supervisor'}`.trim(),
      createdAt: new Date().toISOString()
    };
    fabricRecords.unshift(newSplitRecord);
    updatedRecord = newSplitRecord;
  }

  // Update racks summary
  const srcR = racks.find((r) => r.name === (sourceRack || original.location));
  if (srcR) {
    srcR.occupiedRolls = Math.max(0, srcR.occupiedRolls - rolls);
    srcR.totalWeightKg = Math.max(0, srcR.totalWeightKg - kg);
  }

  const tgtR = racks.find((r) => r.name === targetRack);
  if (tgtR) {
    tgtR.occupiedRolls += rolls;
    tgtR.totalWeightKg += kg;
    if (!tgtR.currentStoreRefs.includes(original.storeRef)) {
      tgtR.currentStoreRefs.push(original.storeRef);
    }
  }

  // Realtime notification
  broadcastRealtime({
    id: `reloc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'FABRIC_RECEIVED',
    title: `Rack Relocation: ${sourceRack || 'Rack'} → ${targetRack}`,
    description: `Transferred ${kg} Kg (${rolls} Rolls) for Store Ref ${original.storeRef} (MRR: ${original.mrrNo}) to ${targetRack}.`,
    author: relocatedBy || 'Warehouse MCD Officer',
    metadata: { mrrNo: original.mrrNo, storeRef: original.storeRef, targetRack }
  });

  res.json({
    success: true,
    message: `Successfully relocated ${kg} Kg (${rolls} Rolls) to ${targetRack}`,
    updatedRecord,
    originalRecord: original,
    allRecords: fabricRecords
  });
});

// Booking Status Analysis and Store Ref Auto-Fill
app.get('/api/fabric-received/store-refs', (req, res) => {
  const map: Record<string, any> = {};

  // First seed from projectOrders
  for (const p of projectOrders) {
    if (p.storeRef) {
      map[p.storeRef] = {
        storeRef: p.storeRef,
        buyerName: p.buyerName,
        styleName: p.styleName,
        fabricsType: 'Single Jersey',
        gsm: '180',
        composition: '100% Combed Cotton',
        certificateName: 'BCI (Better Cotton Initiative)',
        bookingQty: p.totalBookingKg,
        shipment: p.shipmentDate,
        batches: []
      };
    }
  }

  // Then enrich or override from fabricRecords
  for (const rec of fabricRecords) {
    if (!rec.storeRef) continue;
    if (!map[rec.storeRef]) {
      map[rec.storeRef] = {
        storeRef: rec.storeRef,
        buyerName: rec.buyerName,
        styleName: rec.styleName,
        fabricsType: rec.fabricsType,
        gsm: rec.gsm,
        composition: rec.composition,
        certificateName: rec.certificateName,
        bookingQty: rec.bookingQty,
        shipment: rec.shipment,
        batches: []
      };
    } else {
      if (rec.buyerName) map[rec.storeRef].buyerName = rec.buyerName;
      if (rec.styleName) map[rec.storeRef].styleName = rec.styleName;
      if (rec.fabricsType) map[rec.storeRef].fabricsType = rec.fabricsType;
      if (rec.gsm) map[rec.storeRef].gsm = rec.gsm;
      if (rec.composition) map[rec.storeRef].composition = rec.composition;
      if (rec.certificateName) map[rec.storeRef].certificateName = rec.certificateName;
      if (rec.bookingQty) map[rec.storeRef].bookingQty = rec.bookingQty;
    }
    if (rec.batchNo && !map[rec.storeRef].batches.includes(rec.batchNo)) {
      map[rec.storeRef].batches.push(rec.batchNo);
    }
  }

  res.json(Object.values(map));
});

// Booking Status Analysis
app.get('/api/fabric-received/booking-status', (req, res) => {
  const storeRef = req.query.storeRef as string;
  const bookingMap: Record<
    string,
    {
      storeRef: string;
      buyerName: string;
      styleName: string;
      fabricsType: string;
      gsm: string;
      composition: string;
      certificateName: string;
      bookingQty: number;
      receivedQty: number;
      balance: number;
      rolls: number;
      batches: string[];
      status: string;
      personOfCutting: string;
      shipment: string;
      monthName: string;
    }
  > = {};

  // Check projectOrders first for booked orders
  for (const p of projectOrders) {
    if (p.storeRef) {
      bookingMap[p.storeRef] = {
        storeRef: p.storeRef,
        buyerName: p.buyerName,
        styleName: p.styleName,
        fabricsType: 'Single Jersey',
        gsm: '180',
        composition: '100% Combed Cotton',
        certificateName: 'BCI (Better Cotton Initiative)',
        bookingQty: p.totalBookingKg,
        receivedQty: 0,
        balance: p.totalBookingKg,
        rolls: 0,
        batches: [],
        status: 'PENDING RECEIVE',
        personOfCutting: 'Md. Rafiqul Islam (Cutting Floor 1)',
        shipment: p.shipmentDate,
        monthName: 'September'
      };
    }
  }

  for (const rec of fabricRecords) {
    const key = rec.storeRef;
    if (!key) continue;
    if (!bookingMap[key]) {
      bookingMap[key] = {
        storeRef: key,
        buyerName: rec.buyerName,
        styleName: rec.styleName,
        fabricsType: rec.fabricsType,
        gsm: rec.gsm,
        composition: rec.composition,
        certificateName: rec.certificateName,
        bookingQty: rec.bookingQty,
        receivedQty: 0,
        balance: rec.bookingQty,
        rolls: 0,
        batches: [],
        status: 'IN PROGRESS',
        personOfCutting: rec.personOfCutting,
        shipment: rec.shipment,
        monthName: rec.monthName
      };
    } else {
      // Overwrite specs with most recent record
      if (rec.buyerName) bookingMap[key].buyerName = rec.buyerName;
      if (rec.styleName) bookingMap[key].styleName = rec.styleName;
      if (rec.fabricsType) bookingMap[key].fabricsType = rec.fabricsType;
      if (rec.gsm) bookingMap[key].gsm = rec.gsm;
      if (rec.composition) bookingMap[key].composition = rec.composition;
      if (rec.bookingQty) bookingMap[key].bookingQty = rec.bookingQty;
    }
    bookingMap[key].receivedQty += rec.receivedQuantity;
    bookingMap[key].rolls += rec.receivedRoll;
    if (rec.batchNo && !bookingMap[key].batches.includes(rec.batchNo)) {
      bookingMap[key].batches.push(rec.batchNo);
    }
    bookingMap[key].balance = Math.max(0, bookingMap[key].bookingQty - bookingMap[key].receivedQty);
    if (bookingMap[key].receivedQty >= bookingMap[key].bookingQty && bookingMap[key].bookingQty > 0) {
      bookingMap[key].status = 'BOOKING FILLED';
    } else if (bookingMap[key].receivedQty > 0) {
      bookingMap[key].status = 'IN PROGRESS';
    }
  }

  // Also create composite key entries for `${storeRef}||${fabricsType}||${gsm}`
  const compositeMap: Record<string, any> = { ...bookingMap };
  const filledList: string[] = [];

  for (const item of Object.values(bookingMap)) {
    if (item.status === 'BOOKING FILLED') {
      filledList.push(item.storeRef);
    }
    const compKey = `${item.storeRef}||${item.fabricsType}||${item.gsm}`;
    compositeMap[compKey] = item;
  }

  if (storeRef && bookingMap[storeRef]) {
    return res.json(bookingMap[storeRef]);
  }
  res.json({ data: compositeMap, filled: filledList, ...compositeMap });
});

// Fabric Delivery to Cutting
app.get('/api/fabric-delivery', (req, res) => {
  res.json({
    data: deliveryRecords,
    records: deliveryRecords,
    total: deliveryRecords.length
  });
});

app.post('/api/fabric-delivery', (req, res) => {
  const body = req.body;
  const now = new Date();
  const dateCode =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const deliveryNo = `DEL-${dateCode}-${String(deliveryRecords.length + 1).padStart(3, '0')}`;

  const delQty = parseFloat(body.deliveryQuantity) || 0;
  const delRoll = parseInt(body.deliveryRoll) || 0;

  const newDelivery: DeliveryRecord = {
    id: `del-${Date.now()}`,
    deliveryNo,
    mrrNo: body.mrrNo || '',
    storeRef: body.storeRef || '',
    colour: body.colour || '',
    batchNo: body.batchNo || '',
    buyerName: body.buyerName || '',
    styleName: body.styleName || '',
    fabricsType: body.fabricsType || '',
    gsm: body.gsm || '',
    composition: body.composition || '',
    deliveryQuantity: delQty,
    deliveryRoll: delRoll,
    deliveryLocation: body.deliveryLocation || body.personOfCutting || 'Cutting Unit 1',
    deliveryDate: body.deliveryDate || now.toISOString().split('T')[0],
    deliveredBy: body.deliveredBy || 'MCD Store Officer',
    stockInHandAfter: Math.max(0, (parseFloat(body.stockInHandBefore) || 0) - delQty),
    rollInHandAfter: Math.max(0, (parseInt(body.rollInHandBefore) || 0) - delRoll),
    deliveryRemarks: body.deliveryRemarks || '',
    createdAt: now.toISOString()
  };

  deliveryRecords.unshift(newDelivery);

  // Update associated project order progress
  const proj = projectOrders.find((p) => p.storeRef === newDelivery.storeRef);
  if (proj) {
    proj.deliveredKg += delQty;
    proj.progressPercent = Math.min(100, Math.round((proj.deliveredKg / proj.totalBookingKg) * 100));
    proj.updatedAt = now.toISOString();
  }

  // Broadcast real-time update
  broadcastRealtime({
    id: `upd-${Date.now()}`,
    timestamp: now.toISOString(),
    type: 'DELIVERY_DISPATCHED',
    title: `Challan ${newDelivery.deliveryNo} Dispatched to Cutting`,
    description: `${newDelivery.deliveryQuantity} Kg (${newDelivery.deliveryRoll} Rolls) delivered to ${newDelivery.deliveryLocation} for Store Ref ${newDelivery.storeRef}.`,
    author: newDelivery.deliveredBy,
    metadata: { deliveryNo: newDelivery.deliveryNo, storeRef: newDelivery.storeRef }
  });

  res.status(201).json(newDelivery);
});

// Order Transfer
app.get('/api/order-transfer', (req, res) => {
  const mode = req.query.mode;

  if (mode === 'search') {
    const mrrNo = String(req.query.mrrNo || '').trim().toLowerCase();
    const storeRef = String(req.query.storeRef || '').trim().toLowerCase();

    const matches = fabricRecords.filter((rec) => {
      if (mrrNo) {
        return (rec.mrrNo || '').toLowerCase().includes(mrrNo);
      }
      if (storeRef) {
        return (rec.storeRef || '').toLowerCase().includes(storeRef);
      }
      return false;
    });

    const results = matches.map((rec) => {
      const deliveredQty = deliveryRecords
        .filter(
          (d) =>
            d.mrrNo === rec.mrrNo ||
            (d.storeRef === rec.storeRef && d.batchNo === rec.batchNo)
        )
        .reduce((sum, d) => sum + (Number(d.deliveryQuantity) || 0), 0);

      const deliveredRolls = deliveryRecords
        .filter(
          (d) =>
            d.mrrNo === rec.mrrNo ||
            (d.storeRef === rec.storeRef && d.batchNo === rec.batchNo)
        )
        .reduce((sum, d) => sum + (Number(d.deliveryRoll) || 0), 0);

      const stockInHand = Math.max(0, rec.receivedQuantity - deliveredQty);
      const rollInHand = Math.max(0, rec.receivedRoll - deliveredRolls);

      // Calculate pending transfer quantities that are on hold for this stock item
      const pendingTransfers = transferRecords.filter(
        (t) =>
          t.status === 'PENDING' &&
          (t.sourceRecordId === rec.id ||
            (t.sourceMrrNo && t.sourceMrrNo === rec.mrrNo) ||
            (t.sourceStoreRef && t.sourceStoreRef === rec.storeRef && t.sourceBatchNo === rec.batchNo))
      );
      const pendingTransferQty = pendingTransfers.reduce(
        (sum, t) => sum + (Number(t.pendingQty || t.transferQty || t.transferQuantity) || 0),
        0
      );
      const pendingTransferRoll = pendingTransfers.reduce(
        (sum, t) => sum + (Number(t.pendingRoll || t.transferRoll) || 0),
        0
      );
      const deliverableStock = Math.max(0, stockInHand - pendingTransferQty);

      return {
        id: rec.id,
        mrrNo: rec.mrrNo,
        storeRef: rec.storeRef,
        buyerName: rec.buyerName,
        styleName: rec.styleName,
        colour: rec.colour,
        batchNo: rec.batchNo,
        fabricsType: rec.fabricsType,
        gsm: rec.gsm,
        composition: rec.composition || '',
        location: rec.location || '',
        receivedQuantity: rec.receivedQuantity,
        receivedRoll: rec.receivedRoll,
        totalDeliveredQty: Number(deliveredQty.toFixed(2)),
        stockInHand: Number(stockInHand.toFixed(2)),
        rollInHand,
        row: (rec as any).row || rec.location || '-',
        pendingTransferQty: Number(pendingTransferQty.toFixed(2)),
        pendingTransferRoll,
        deliverableStock: Number(deliverableStock.toFixed(2))
      };
    });

    return res.json({
      data: results,
      total: results.length
    });
  }

  if (mode === 'pending') {
    const pending = transferRecords.filter((t) => t.status === 'PENDING');
    const formattedPending = pending.map((t) => ({
      id: t.id,
      transferNo: t.transferNo,
      sourceRecordId: t.sourceRecordId || '',
      sourceMrrNo: t.sourceMrrNo || '',
      sourceStoreRef: t.sourceStoreRef || '',
      sourceBatchNo: t.sourceBatchNo || '',
      targetOrderNo: t.targetOrderNo || (t as any).targetStoreRef || '',
      transferQty: t.transferQty || (t as any).transferQuantity || 0,
      transferRoll: t.transferRoll || 0,
      pendingQty: t.pendingQty ?? (t.transferQty || (t as any).transferQuantity || 0),
      pendingRoll: t.pendingRoll ?? (t.transferRoll || 0),
      transferDate: t.transferDate || '',
      deliveryNo: t.deliveryNo || (t as any).transferNo || '',
      remarks: t.remarks || (t as any).reason || '',
      transferType: t.transferType || 'HOLD_PENDING',
      status: t.status || 'PENDING',
      createdAt: t.createdAt
    }));

    return res.json({
      data: formattedPending,
      records: formattedPending,
      total: formattedPending.length
    });
  }

  if (mode === 'history') {
    const sourceRecordId = String(req.query.sourceRecordId || '').trim();
    const history = sourceRecordId
      ? transferRecords.filter(
          (t) =>
            t.sourceRecordId === sourceRecordId ||
            t.id === sourceRecordId ||
            (t as any).sourceMrrNo === sourceRecordId
        )
      : transferRecords;

    const formattedHistory = history.map((t) => ({
      id: t.id,
      transferNo: t.transferNo,
      sourceRecordId: t.sourceRecordId || sourceRecordId,
      sourceMrrNo: t.sourceMrrNo || '',
      sourceStoreRef: t.sourceStoreRef || '',
      sourceBatchNo: t.sourceBatchNo || '',
      targetOrderNo: t.targetOrderNo || (t as any).targetStoreRef || '',
      transferQty: t.transferQty || (t as any).transferQuantity || 0,
      transferRoll: t.transferRoll || 0,
      pendingQty: t.pendingQty ?? 0,
      pendingRoll: t.pendingRoll ?? 0,
      transferDate: t.transferDate || '',
      deliveryNo: t.deliveryNo || (t as any).transferNo || '',
      remarks: t.remarks || (t as any).reason || '',
      transferType: t.transferType || 'DIRECT_DELIVERY',
      status: t.status || 'DELIVERED',
      releasedAt: t.releasedAt,
      releasedBy: t.releasedBy,
      createdAt: t.createdAt
    }));

    return res.json({
      data: formattedHistory,
      total: formattedHistory.length
    });
  }

  res.json({
    data: transferRecords,
    records: transferRecords,
    total: transferRecords.length
  });
});

app.post('/api/order-transfer', (req, res) => {
  const body = req.body;
  const now = new Date();
  const dateCode =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const seq = String(transferRecords.length + 1).padStart(3, '0');
  const transferNo = `TR-${dateCode}-${seq}`;
  const deliveryNo = body.transferType === 'HOLD_PENDING' ? `HOLD-${dateCode}-${seq}` : `OT-${dateCode}-${seq}`;

  const sourceRecordId = body.sourceRecordId || body.sourceId || '';
  const sourceRec = fabricRecords.find(
    (r) =>
      r.id === sourceRecordId ||
      (body.sourceMrrNo && r.mrrNo === body.sourceMrrNo) ||
      (body.sourceStoreRef && r.storeRef === body.sourceStoreRef)
  );

  const transferQty = parseFloat(body.transferQty || body.transferQuantity) || 0;
  const transferRoll = parseInt(body.transferRoll) || 0;
  const targetOrderNo = (body.targetOrderNo || body.targetStoreRef || '').trim();
  const transferDate = body.transferDate || now.toISOString().split('T')[0];
  const remarks = (body.remarks || body.reason || '').trim();
  const transferType: 'DIRECT_DELIVERY' | 'HOLD_PENDING' =
    body.transferType === 'HOLD_PENDING' ? 'HOLD_PENDING' : 'DIRECT_DELIVERY';
  const isPending = transferType === 'HOLD_PENDING';

  if (!targetOrderNo) {
    return res.status(400).json({ error: 'Target Order Number is required' });
  }

  if (transferQty <= 0) {
    return res.status(400).json({ error: 'Transfer quantity must be greater than 0' });
  }

  let stockInHand = 0;
  let rollInHand = 0;

  if (sourceRec) {
    const deliveredQty = deliveryRecords
      .filter(
        (d) =>
          d.mrrNo === sourceRec.mrrNo ||
          (d.storeRef === sourceRec.storeRef && d.batchNo === sourceRec.batchNo)
      )
      .reduce((sum, d) => sum + (Number(d.deliveryQuantity) || 0), 0);

    const deliveredRolls = deliveryRecords
      .filter(
        (d) =>
          d.mrrNo === sourceRec.mrrNo ||
          (d.storeRef === sourceRec.storeRef && d.batchNo === sourceRec.batchNo)
      )
      .reduce((sum, d) => sum + (Number(d.deliveryRoll) || 0), 0);

    stockInHand = Math.max(0, sourceRec.receivedQuantity - deliveredQty);
    rollInHand = Math.max(0, sourceRec.receivedRoll - deliveredRolls);

    if (transferQty > stockInHand) {
      return res.status(400).json({
        error: `Insufficient Stock! Available: ${stockInHand.toFixed(2)} Kg, Requested: ${transferQty} Kg`
      });
    }

    if (transferRoll > rollInHand && rollInHand > 0) {
      return res.status(400).json({
        error: `Insufficient Roll! Available: ${rollInHand} Rolls, Requested: ${transferRoll} Rolls`
      });
    }
  }

  const newTransfer: OrderTransferRecord = {
    id: `tr-${Date.now()}`,
    transferNo,
    deliveryNo,
    sourceRecordId: sourceRec ? sourceRec.id : sourceRecordId,
    sourceMrrNo: sourceRec ? sourceRec.mrrNo : body.sourceMrrNo || '',
    sourceStoreRef: sourceRec ? sourceRec.storeRef : body.sourceStoreRef || '',
    sourceBatchNo: sourceRec ? sourceRec.batchNo : body.sourceBatchNo || '',
    targetOrderNo,
    targetStoreRef: targetOrderNo,
    targetBuyerName: body.targetBuyerName || (sourceRec ? sourceRec.buyerName : ''),
    targetStyleName: body.targetStyleName || (sourceRec ? sourceRec.styleName : ''),
    transferQty,
    transferQuantity: transferQty,
    transferRoll,
    remarks,
    reason: remarks,
    transferDate,
    transferredBy: 'finishmcd@gmail.com',
    transferType,
    status: isPending ? 'PENDING' : 'DELIVERED',
    pendingQty: isPending ? transferQty : 0,
    pendingRoll: isPending ? transferRoll : 0,
    createdAt: now.toISOString()
  };

  transferRecords.unshift(newTransfer);

  // If DIRECT_DELIVERY: Deduct stock immediately by creating DeliveryRecord
  // If HOLD_PENDING: Stock is NOT deducted (Stock Deducted = 0 KG)
  if (!isPending && sourceRec) {
    const newDelivery: DeliveryRecord = {
      id: `del-tr-${Date.now()}`,
      deliveryNo,
      mrrNo: sourceRec.mrrNo,
      storeRef: sourceRec.storeRef,
      colour: sourceRec.colour,
      batchNo: sourceRec.batchNo,
      buyerName: sourceRec.buyerName,
      styleName: sourceRec.styleName,
      fabricsType: sourceRec.fabricsType,
      gsm: sourceRec.gsm,
      composition: sourceRec.composition || '',
      deliveryQuantity: transferQty,
      deliveryRoll: transferRoll,
      deliveryLocation: `Order Transfer (Direct Delivery) -> ${targetOrderNo}`,
      deliveryDate: transferDate,
      deliveredBy: 'finishmcd@gmail.com',
      stockInHandAfter: Math.max(0, stockInHand - transferQty),
      rollInHandAfter: Math.max(0, rollInHand - transferRoll),
      deliveryRemarks: remarks ? `Order Transfer: ${remarks}` : `Transferred to Order ${targetOrderNo}`,
      createdAt: now.toISOString()
    };
    deliveryRecords.unshift(newDelivery);
  }

  // Broadcast real-time update
  broadcastRealtime({
    id: `upd-${Date.now()}`,
    timestamp: now.toISOString(),
    type: 'TRANSFER_DONE',
    title: isPending ? `Order Transfer Hold ${newTransfer.transferNo}` : `Order Transfer Direct Delivery ${newTransfer.deliveryNo}`,
    description: isPending
      ? `${transferQty} Kg placed on Hold / Pending from ${newTransfer.sourceMrrNo || newTransfer.sourceStoreRef} to ${targetOrderNo}. Stock deducted: 0 Kg.`
      : `${transferQty} Kg transferred and delivered from ${newTransfer.sourceMrrNo || newTransfer.sourceStoreRef} to ${targetOrderNo}.`,
    author: 'finishmcd@gmail.com',
    metadata: { deliveryNo, targetOrderNo, isPending, transferType }
  });

  const sourceStockAfter = {
    qty: Number((isPending ? stockInHand : Math.max(0, stockInHand - transferQty)).toFixed(2)),
    roll: isPending ? rollInHand : Math.max(0, rollInHand - transferRoll)
  };

  res.status(201).json({
    success: true,
    transferType,
    status: isPending ? 'PENDING' : 'DELIVERED',
    stockDeducted: isPending ? 0 : transferQty,
    pendingQty: isPending ? transferQty : 0,
    sourceStockAfter,
    transfer: newTransfer,
    ...newTransfer
  });
});

// Release / Confirm a Pending Order Transfer
app.post(['/api/order-transfer/:id/release', '/api/order-transfer/release'], (req, res) => {
  const transferId = req.params.id || req.body.id || req.body.transferId;
  if (!transferId) {
    return res.status(400).json({ error: 'Transfer ID is required' });
  }

  const transferIndex = transferRecords.findIndex((t) => t.id === transferId || t.transferNo === transferId);
  if (transferIndex === -1) {
    return res.status(404).json({ error: 'Order Transfer record not found' });
  }

  const transfer = transferRecords[transferIndex];
  if (transfer.status !== 'PENDING') {
    return res.status(400).json({
      error: `Order Transfer is already ${transfer.status}. Only PENDING orders can be released.`
    });
  }

  const now = new Date();
  const dateCode =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const seq = String(deliveryRecords.length + 1).padStart(3, '0');
  const releaseDeliveryNo = `OT-REL-${dateCode}-${seq}`;

  const sourceRec = fabricRecords.find(
    (r) =>
      r.id === transfer.sourceRecordId ||
      (transfer.sourceMrrNo && r.mrrNo === transfer.sourceMrrNo) ||
      (transfer.sourceStoreRef && r.storeRef === transfer.sourceStoreRef && r.batchNo === transfer.sourceBatchNo)
  );

  const transferQty = Number(transfer.transferQty || transfer.transferQuantity) || 0;
  const transferRoll = Number(transfer.transferRoll) || 0;

  let currentStockInHand = 0;
  let currentRollInHand = 0;

  if (sourceRec) {
    const deliveredQty = deliveryRecords
      .filter(
        (d) =>
          d.mrrNo === sourceRec.mrrNo ||
          (d.storeRef === sourceRec.storeRef && d.batchNo === sourceRec.batchNo)
      )
      .reduce((sum, d) => sum + (Number(d.deliveryQuantity) || 0), 0);

    const deliveredRolls = deliveryRecords
      .filter(
        (d) =>
          d.mrrNo === sourceRec.mrrNo ||
          (d.storeRef === sourceRec.storeRef && d.batchNo === sourceRec.batchNo)
      )
      .reduce((sum, d) => sum + (Number(d.deliveryRoll) || 0), 0);

    currentStockInHand = Math.max(0, sourceRec.receivedQuantity - deliveredQty);
    currentRollInHand = Math.max(0, sourceRec.receivedRoll - deliveredRolls);

    if (transferQty > currentStockInHand) {
      return res.status(400).json({
        error: `Cannot Release: Insufficient Physical Stock! Available: ${currentStockInHand.toFixed(2)} Kg, Required: ${transferQty} Kg`
      });
    }

    // Deduct stock now by inserting DeliveryRecord
    const newDelivery: DeliveryRecord = {
      id: `del-rel-${Date.now()}`,
      deliveryNo: releaseDeliveryNo,
      mrrNo: sourceRec.mrrNo,
      storeRef: sourceRec.storeRef,
      colour: sourceRec.colour,
      batchNo: sourceRec.batchNo,
      buyerName: sourceRec.buyerName,
      styleName: sourceRec.styleName,
      fabricsType: sourceRec.fabricsType,
      gsm: sourceRec.gsm,
      composition: sourceRec.composition || '',
      deliveryQuantity: transferQty,
      deliveryRoll: transferRoll,
      deliveryLocation: `Released Order Transfer -> ${transfer.targetOrderNo || transfer.targetStoreRef}`,
      deliveryDate: now.toISOString().split('T')[0],
      deliveredBy: 'finishmcd@gmail.com',
      stockInHandAfter: Math.max(0, currentStockInHand - transferQty),
      rollInHandAfter: Math.max(0, currentRollInHand - transferRoll),
      deliveryRemarks: `Released Pending Order Transfer: ${transfer.transferNo} to Order ${transfer.targetOrderNo || transfer.targetStoreRef}`,
      createdAt: now.toISOString()
    };
    deliveryRecords.unshift(newDelivery);
  }

  // Update transfer record
  transfer.status = 'RELEASED';
  transfer.pendingQty = 0;
  transfer.pendingRoll = 0;
  transfer.deliveryNo = releaseDeliveryNo;
  transfer.releasedAt = now.toISOString();
  transfer.releasedBy = 'finishmcd@gmail.com';

  // Broadcast real-time update
  broadcastRealtime({
    id: `upd-${Date.now()}`,
    timestamp: now.toISOString(),
    type: 'TRANSFER_DONE',
    title: `Order Transfer Released ${transfer.transferNo}`,
    description: `${transferQty} Kg pending order released and deducted from stock into Delivery Challan ${releaseDeliveryNo}.`,
    author: 'finishmcd@gmail.com',
    metadata: { transferNo: transfer.transferNo, releaseDeliveryNo, targetOrderNo: transfer.targetOrderNo }
  });

  res.json({
    success: true,
    message: `Pending Order Transfer ${transfer.transferNo} has been released and confirmed. ${transferQty} Kg deducted from stock.`,
    transfer,
    stockAfterRelease: {
      qty: Number(Math.max(0, currentStockInHand - transferQty).toFixed(2)),
      roll: Math.max(0, currentRollInHand - transferRoll)
    }
  });
});

// Stock Ledger
app.get('/api/stock-ledger', (req, res) => {
  const ledgerMap: Record<
    string,
    {
      storeRef: string;
      buyerName: string;
      styleName: string;
      fabricsType: string;
      gsm: string;
      composition: string;
      colour: string;
      totalReceivedQty: number;
      totalReceivedRolls: number;
      totalDeliveredQty: number;
      totalDeliveredRolls: number;
      balanceQty: number;
      balanceRolls: number;
      location: string;
      status: 'In Stock' | 'Low Stock' | 'Exhausted';
    }
  > = {};

  for (const r of fabricRecords) {
    const key = `${r.storeRef}_${r.colour}_${r.fabricsType}`;
    if (!ledgerMap[key]) {
      ledgerMap[key] = {
        storeRef: r.storeRef,
        buyerName: r.buyerName,
        styleName: r.styleName,
        fabricsType: r.fabricsType,
        gsm: r.gsm,
        composition: r.composition,
        colour: r.colour,
        totalReceivedQty: 0,
        totalReceivedRolls: 0,
        totalDeliveredQty: 0,
        totalDeliveredRolls: 0,
        balanceQty: 0,
        balanceRolls: 0,
        location: r.location,
        status: 'In Stock'
      };
    }
    ledgerMap[key].totalReceivedQty += r.receivedQuantity;
    ledgerMap[key].totalReceivedRolls += r.receivedRoll;
  }

  // Deduct deliveries
  for (const d of deliveryRecords) {
    const key = `${d.storeRef}_${d.colour}_${d.fabricsType}`;
    if (ledgerMap[key]) {
      ledgerMap[key].totalDeliveredQty += d.deliveryQuantity;
      ledgerMap[key].totalDeliveredRolls += d.deliveryRoll;
    }
  }

  // Calculate balances
  const result = Object.values(ledgerMap).map((item) => {
    item.balanceQty = Math.max(0, item.totalReceivedQty - item.totalDeliveredQty);
    item.balanceRolls = Math.max(0, item.totalReceivedRolls - item.totalDeliveredRolls);
    if (item.balanceQty === 0) item.status = 'Exhausted';
    else if (item.balanceQty < 200) item.status = 'Low Stock';
    else item.status = 'In Stock';
    return item;
  });

  res.json({ data: result, total: result.length });
});

// Booking Closing Report
app.get('/api/booking-closing-report', (req, res) => {
  const reportMap: Record<
    string,
    {
      storeRef: string;
      buyerName: string;
      styleName: string;
      fabricsType: string;
      colour: string;
      bookingQty: number;
      receivedQty: number;
      balanceQty: number;
      variancePercent: number;
      status: 'BOOKING FILLED' | 'IN PROGRESS' | 'OVER-RECEIVED' | 'SHORTAGE';
      monthName: string;
      shipmentDate: string;
    }
  > = {};

  for (const r of fabricRecords) {
    const key = `${r.storeRef}_${r.colour}`;
    if (!reportMap[key]) {
      reportMap[key] = {
        storeRef: r.storeRef,
        buyerName: r.buyerName,
        styleName: r.styleName,
        fabricsType: r.fabricsType,
        colour: r.colour,
        bookingQty: r.bookingQty,
        receivedQty: 0,
        balanceQty: r.bookingQty,
        variancePercent: 0,
        status: 'IN PROGRESS',
        monthName: r.monthName,
        shipmentDate: r.shipment
      };
    }
    reportMap[key].receivedQty += r.receivedQuantity;
  }

  const report = Object.values(reportMap).map((item) => {
    const diff = item.receivedQty - item.bookingQty;
    item.balanceQty = Math.max(0, item.bookingQty - item.receivedQty);
    item.variancePercent = item.bookingQty > 0 ? parseFloat(((diff / item.bookingQty) * 100).toFixed(2)) : 0;

    if (item.receivedQty >= item.bookingQty) {
      item.status = diff > 50 ? 'OVER-RECEIVED' : 'BOOKING FILLED';
    } else {
      item.status = 'IN PROGRESS';
    }
    return item;
  });

  res.json({ data: report, total: report.length });
});

// Real-time Rack Stock Computation Helper
function calculateRackStockFromDatabase(rackQuery: string) {
  const rawQ = String(rackQuery || '').trim();
  const q = rawQ.toLowerCase();

  // 1. Automatic Rack Location Detection from server database
  let matchedRack = racks.find((r) => {
    const idMatch = r.rackId.toLowerCase() === q;
    const nameMatch = r.name.toLowerCase() === q;
    const locMatch = (r.location || '').toLowerCase() === q;
    const rackNoMatch = (r.rackNo || '').toLowerCase() === q;
    const subNameMatch = r.name.toLowerCase().includes(q) || q.includes(r.name.toLowerCase());
    const subRackNoMatch = r.rackNo ? q.includes(r.rackNo.toLowerCase()) : false;
    return idMatch || nameMatch || locMatch || rackNoMatch || subNameMatch || subRackNoMatch;
  });

  if (!matchedRack) {
    const dropdownMatch = dropdownData.location.find(
      (loc) =>
        loc.toLowerCase() === q ||
        loc.toLowerCase().includes(q) ||
        q.includes(loc.toLowerCase())
    );
    if (dropdownMatch) {
      const parts = dropdownMatch.split('/');
      const rNo = parts[0]?.replace(/Rack:/i, '').trim() || dropdownMatch;
      const lNo = parts[1]?.replace(/Location:/i, '').trim() || dropdownMatch;
      matchedRack = {
        rackId: `R-${dropdownMatch.replace(/[^a-zA-Z0-9]/g, '')}`,
        rackNo: rNo,
        location: lNo,
        name: dropdownMatch,
        zone: 'Warehouse MCD Finished Floor',
        capacityRolls: 80,
        capacityKg: 2500,
        occupiedRolls: 0,
        currentStoreRefs: [],
        totalWeightKg: 0
      };
    } else {
      matchedRack = {
        rackId: `R-${rawQ.replace(/[^a-zA-Z0-9]/g, '') || 'BAY'}`,
        rackNo: rawQ,
        location: rawQ,
        name: rawQ.startsWith('Rack') ? rawQ : `Rack: ${rawQ}`,
        zone: 'Warehouse Storage',
        capacityRolls: 80,
        capacityKg: 2500,
        occupiedRolls: 0,
        currentStoreRefs: [],
        totalWeightKg: 0
      };
    }
  }

  // 2. Find all Fabric Records currently in this Rack
  const matchingFabrics = fabricRecords.filter((rec) => {
    if (!rec.location) return false;
    const recLoc = rec.location.trim().toLowerCase();
    const rackName = matchedRack!.name.toLowerCase();
    const rackNo = (matchedRack!.rackNo || '').toLowerCase();
    const locStr = (matchedRack!.location || '').toLowerCase();

    // Exact or partial location match (e.g., 'Rack: R-05 / Location: A-01', 'Rack A-01', 'A-01', 'R-05')
    if (recLoc === rackName || recLoc === q) return true;
    if (rackNo && recLoc === rackNo) return true;
    if (locStr && recLoc === locStr) return true;
    if (recLoc.includes(rackName) || rackName.includes(recLoc)) return true;
    if (rackNo && recLoc.includes(rackNo)) return true;
    return false;
  });

  // 3. For each Fabric Record in this Rack, calculate in Real-Time:
  // - Receive Quantity
  // - Delivery Quantity (sum from deliveryRecords)
  // - Current Balance Quantity / Stock in Hand (Receive - Delivery)
  // - Roll Quantity (Receive Rolls - Delivery Rolls)
  const stockItems = matchingFabrics.map((rec) => {
    const matchingDeliveries = deliveryRecords.filter((d) => {
      const matchMrr = d.mrrNo && rec.mrrNo && d.mrrNo === rec.mrrNo;
      const matchStoreRefBatch =
        d.storeRef === rec.storeRef &&
        d.batchNo &&
        rec.batchNo &&
        d.batchNo.toLowerCase() === rec.batchNo.toLowerCase();
      return matchMrr || matchStoreRefBatch;
    });

    const deliveryQty = matchingDeliveries.reduce(
      (sum, d) => sum + (Number(d.deliveryQuantity) || 0),
      0
    );
    const deliveryRoll = matchingDeliveries.reduce(
      (sum, d) => sum + (Number(d.deliveryRoll) || 0),
      0
    );

    const balanceQty = Math.max(0, (Number(rec.receivedQuantity) || 0) - deliveryQty);
    const balanceRoll = Math.max(0, (Number(rec.receivedRoll) || 0) - deliveryRoll);

    return {
      id: rec.id,
      storeRef: rec.storeRef || '-',
      buyer: rec.buyerName || '-',
      fabricType: rec.fabricsType || '-',
      gsm: rec.gsm || '-',
      color: rec.colour || '-',
      batchNo: rec.batchNo || '-',
      lotNo: (rec as any).lotNo || rec.batchNo || 'LOT-01',
      receiveQty: Number(rec.receivedQuantity) || 0,
      deliveryQty,
      balanceQty,
      receiveRoll: Number(rec.receivedRoll) || 0,
      deliveryRoll,
      balanceRoll,
      rackNo: matchedRack!.rackNo || matchedRack!.name,
      rackLocation: matchedRack!.location || rec.location,
      mrrNo: rec.mrrNo || '-',
      styleName: rec.styleName || '-',
      composition: rec.composition || '-',
      approvalOk: rec.approvalOk || 'OK',
      receivedDate: rec.receivedDate || '-',
      remarks: rec.remarks || ''
    };
  });

  // 4. Multiple SR in One Rack - Group summary for SRs (Requirement #4)
  const srMap = new Map<string, any>();
  for (const item of stockItems) {
    const key = item.storeRef;
    if (!srMap.has(key)) {
      srMap.set(key, {
        storeRef: item.storeRef,
        buyer: item.buyer,
        fabricType: item.fabricType,
        color: item.color,
        gsm: item.gsm,
        receiveQty: 0,
        deliveryQty: 0,
        balanceQty: 0,
        receiveRoll: 0,
        deliveryRoll: 0,
        balanceRoll: 0,
        batchCount: 0,
        batches: []
      });
    }
    const group = srMap.get(key);
    group.receiveQty += item.receiveQty;
    group.deliveryQty += item.deliveryQty;
    group.balanceQty += item.balanceQty;
    group.receiveRoll += item.receiveRoll;
    group.deliveryRoll += item.deliveryRoll;
    group.balanceRoll += item.balanceRoll;
    group.batchCount += 1;
    if (!group.batches.includes(item.batchNo)) {
      group.batches.push(item.batchNo);
    }
  }

  const srSummary = Array.from(srMap.values());

  // 5. Total Quantity and Aggregates for the Rack
  const totalReceiveQty = stockItems.reduce((acc, i) => acc + i.receiveQty, 0);
  const totalDeliveryQty = stockItems.reduce((acc, i) => acc + i.deliveryQty, 0);
  const totalBalanceQty = stockItems.reduce((acc, i) => acc + i.balanceQty, 0);
  const totalReceiveRolls = stockItems.reduce((acc, i) => acc + i.receiveRoll, 0);
  const totalDeliveryRolls = stockItems.reduce((acc, i) => acc + i.deliveryRoll, 0);
  const totalBalanceRolls = stockItems.reduce((acc, i) => acc + i.balanceRoll, 0);

  return {
    success: true,
    rack: {
      rackId: matchedRack!.rackId,
      rackNo: matchedRack!.rackNo || matchedRack!.name,
      location: matchedRack!.location || matchedRack!.name,
      name: matchedRack!.name,
      zone: matchedRack!.zone,
      capacityRolls: matchedRack!.capacityRolls,
      capacityKg: matchedRack!.capacityKg || 2500
    },
    summary: {
      totalReceiveQty,
      totalDeliveryQty,
      totalBalanceQty,
      totalReceiveRolls,
      totalDeliveryRolls,
      totalBalanceRolls,
      distinctSRs: srSummary.length,
      distinctBatches: stockItems.length
    },
    srSummary,
    stocks: stockItems,
    serverTimestamp: new Date().toISOString()
  };
}

// Rack QR Data & Real-time Stock Endpoints
app.get('/api/rack-data', (req, res) => {
  // Return racks enriched with real-time stock balances from database
  const enrichedRacks = racks.map((r) => {
    const stockInfo = calculateRackStockFromDatabase(r.name);
    return {
      ...r,
      occupiedRolls: stockInfo.summary.totalBalanceRolls,
      totalWeightKg: stockInfo.summary.totalBalanceQty,
      currentStoreRefs: stockInfo.srSummary.map((s) => s.storeRef),
      totalReceiveQty: stockInfo.summary.totalReceiveQty,
      totalDeliveryQty: stockInfo.summary.totalDeliveryQty,
      totalBalanceQty: stockInfo.summary.totalBalanceQty,
      totalBalanceRolls: stockInfo.summary.totalBalanceRolls,
      distinctSRs: stockInfo.summary.distinctSRs,
      srSummary: stockInfo.srSummary
    };
  });
  res.json({ racks: enrichedRacks, total: enrichedRacks.length, serverTimestamp: new Date().toISOString() });
});

// Real-time Rack Stock by Query param or Route param
app.get('/api/racks/stock', (req, res) => {
  const rackQuery = String(req.query.rack || req.query.location || req.query.rackId || req.query.q || '').trim();
  if (!rackQuery) {
    return res.status(400).json({ error: 'Please provide a rack identifier (rack, location, or rackId)' });
  }
  const result = calculateRackStockFromDatabase(rackQuery);
  res.json(result);
});

app.get('/api/racks/:rackId/stock', (req, res) => {
  const rackQuery = req.params.rackId;
  const result = calculateRackStockFromDatabase(rackQuery);
  res.json(result);
});

// Settings Dropdown Data
app.get('/api/settings/dropdown-data', (req, res) => {
  res.json(dropdownData);
});

app.post('/api/settings/dropdown-data', (req, res) => {
  const { category, value } = req.body;
  if (!category || !value || !dropdownData[category as keyof DropdownMasterData]) {
    return res.status(400).json({ error: 'Invalid category or value.' });
  }
  const list = dropdownData[category as keyof DropdownMasterData];
  if (!list.includes(value)) {
    list.push(value);
  }
  res.json({ status: 'ok', category, list });
});

app.delete('/api/settings/dropdown-data', (req, res) => {
  const { category, value } = req.body;
  if (!category || !value || !dropdownData[category as keyof DropdownMasterData]) {
    return res.status(400).json({ error: 'Invalid category or value.' });
  }
  const list = dropdownData[category as keyof DropdownMasterData];
  const idx = list.indexOf(value);
  if (idx !== -1) {
    list.splice(idx, 1);
  }
  res.json({ status: 'ok', category, list });
});

// Settings Production Token
app.get('/api/settings/production-token', (req, res) => {
  res.json({ token: productionToken });
});

app.post('/api/settings/production-token', (req, res) => {
  const { token } = req.body;
  if (token) {
    productionToken = token;
  }
  res.json({ status: 'ok', token: productionToken });
});

// Tasks Management Endpoints
app.get('/api/tasks', (req, res) => {
  const status = req.query.status as string;
  let list = [...userTasks];
  if (status) {
    list = list.filter((t) => t.status === status);
  }
  res.json({ data: list, total: list.length });
});

app.post('/api/tasks', (req, res) => {
  const body = req.body;
  const newTask: UserTask = {
    id: `task-${Date.now()}`,
    title: body.title || 'Untitled Task',
    description: body.description || '',
    status: body.status || 'TODO',
    priority: body.priority || 'MEDIUM',
    assignee: body.assignee || 'finishmcd@gmail.com',
    assigneeEmail: body.assigneeEmail || 'finishmcd@gmail.com',
    storeRef: body.storeRef || '',
    mrrNo: body.mrrNo || '',
    dueDate: body.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    tags: Array.isArray(body.tags) ? body.tags : ['Warehouse']
  };

  userTasks.unshift(newTask);

  broadcastRealtime({
    id: `upd-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'TASK_UPDATED',
    title: `New Task Assigned: "${newTask.title}"`,
    description: `Assigned to ${newTask.assignee} with priority [${newTask.priority}].`,
    author: 'Project Task Manager',
    metadata: { taskId: newTask.id }
  });

  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const idx = userTasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const oldStatus = userTasks[idx].status;
  userTasks[idx] = {
    ...userTasks[idx],
    ...req.body,
    completedAt: req.body.status === 'COMPLETED' ? new Date().toISOString() : userTasks[idx].completedAt
  };

  if (oldStatus !== userTasks[idx].status) {
    broadcastRealtime({
      id: `upd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'TASK_UPDATED',
      title: `Task Status Updated to ${userTasks[idx].status}`,
      description: `Task "${userTasks[idx].title}" status transitioned by ${userTasks[idx].assignee}.`,
      author: userTasks[idx].assignee,
      metadata: { taskId: userTasks[idx].id, status: userTasks[idx].status }
    });
  }

  res.json(userTasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const idx = userTasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const deleted = userTasks.splice(idx, 1)[0];
  res.json({ status: 'deleted', task: deleted });
});

// Projects & Project Updates Endpoints
app.get('/api/projects', (req, res) => {
  res.json({ data: projectOrders, total: projectOrders.length });
});

app.post('/api/projects', (req, res) => {
  const body = req.body;
  const newProj: ProjectOrder = {
    id: `proj-${Date.now()}`,
    orderNumber: body.orderNumber || 'PO-New Order',
    buyerName: body.buyerName || '',
    styleName: body.styleName || '',
    storeRef: body.storeRef || '',
    totalBookingKg: parseFloat(body.totalBookingKg) || 0,
    receivedKg: parseFloat(body.receivedKg) || 0,
    deliveredKg: 0,
    cuttingTargetPcs: parseInt(body.cuttingTargetPcs) || 0,
    status: body.status || 'Planning',
    progressPercent: 0,
    shipmentDate: body.shipmentDate || '',
    manager: body.manager || 'MCD Coordinator',
    updatedAt: new Date().toISOString()
  };
  projectOrders.unshift(newProj);
  res.status(201).json(newProj);
});

app.get('/api/project-updates', (req, res) => {
  res.json({ data: realtimeUpdates, total: realtimeUpdates.length });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() });
});

// Explicit API 404 handler - prevents unhandled /api calls from falling through to Vite SPA html
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Vite middleware / Production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GMS FINISH FABRIC MCD server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
