export interface FabricRecord {
  id: string;
  mrrNo: string;
  warehouseName: string;
  buyerName: string;
  styleName: string;
  storeRef: string;
  fabricsType: string;
  gsm: string;
  certificateName: string;
  composition: string;
  receivedDate: string;
  colour: string;
  batchNo: string;
  bookingQty: number;
  greyQty: number;
  receivedQuantity: number;
  receivedRoll: number;
  plPercent: string;
  approvalOk: 'OK' | 'RE-CHECK' | 'PENDING' | 'REJECT';
  dyeingStatus: 'OK' | 'RE-DYEING' | 'HOLD' | 'SHADE VARIATION';
  location: string;
  collarCuffInPcs: string;
  dia?: string;
  rollWeights?: string;
  remarks: string;
  rcvTime?: string;
  dlvdTime?: string;
  personOfCutting: string;
  reasonBackToDyeing?: string;
  monthName: string;
  shipment: string;
  createdAt: string;
}

export interface DeliveryRecord {
  id: string;
  deliveryNo: string;
  mrrNo: string;
  storeRef: string;
  colour: string;
  batchNo: string;
  buyerName: string;
  styleName: string;
  fabricsType: string;
  gsm: string;
  composition: string;
  deliveryQuantity: number;
  deliveryRoll: number;
  deliveryLocation: string; // Cutting Name
  deliveryDate: string;
  deliveredBy: string;
  stockInHandAfter: number;
  rollInHandAfter: number;
  deliveryRemarks: string;
  createdAt: string;
}

export interface OrderTransferRecord {
  id: string;
  transferNo: string;
  sourceMrrNo: string;
  sourceStoreRef: string;
  sourceBatchNo: string;
  targetStoreRef: string;
  targetBuyerName: string;
  targetStyleName: string;
  transferQuantity: number;
  transferRoll: number;
  reason: string;
  transferDate: string;
  transferredBy: string;
  createdAt: string;
  // Extended fields for flexible views
  sourceRecordId?: string;
  targetOrderNo?: string;
  transferQty?: number;
  deliveryNo?: string;
  remarks?: string;
  transferType?: 'DIRECT_DELIVERY' | 'HOLD_PENDING';
  status?: 'DELIVERED' | 'PENDING' | 'RELEASED';
  pendingQty?: number;
  pendingRoll?: number;
  releasedAt?: string;
  releasedBy?: string;
}

export interface StockLedgerItem {
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

export interface BookingReportItem {
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

export interface RackData {
  rackId: string;
  rackNo?: string;
  location?: string;
  name: string;
  zone: string;
  capacityRolls: number;
  capacityKg?: number;
  occupiedRolls?: number;
  currentStoreRefs?: string[];
  totalWeightKg?: number;
}

export interface RackStockItem {
  id: string;
  storeRef: string;
  buyer: string;
  fabricType: string;
  gsm: string;
  color: string;
  batchNo: string;
  lotNo: string;
  receiveQty: number;
  deliveryQty: number;
  balanceQty: number;
  receiveRoll: number;
  deliveryRoll: number;
  balanceRoll: number;
  rackNo: string;
  rackLocation: string;
  mrrNo: string;
  styleName?: string;
  composition?: string;
  approvalOk?: 'OK' | 'RE-CHECK' | 'PENDING' | 'REJECT';
  receivedDate?: string;
  remarks?: string;
}

export interface RackSRGroupSummary {
  storeRef: string;
  buyer: string;
  fabricType: string;
  color: string;
  gsm: string;
  receiveQty: number;
  deliveryQty: number;
  balanceQty: number;
  receiveRoll: number;
  deliveryRoll: number;
  balanceRoll: number;
  batchCount: number;
  batches: string[];
}

export interface RackStockResponse {
  success: boolean;
  message?: string;
  rack: {
    rackId: string;
    rackNo: string;
    location: string;
    name: string;
    zone: string;
    capacityRolls?: number;
    capacityKg?: number;
  };
  summary: {
    totalReceiveQty: number;
    totalDeliveryQty: number;
    totalBalanceQty: number;
    totalReceiveRolls: number;
    totalDeliveryRolls: number;
    totalBalanceRolls: number;
    distinctSRs: number;
    distinctBatches: number;
  };
  srSummary: RackSRGroupSummary[];
  stocks: RackStockItem[];
  serverTimestamp: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeEmail?: string;
  storeRef?: string;
  mrrNo?: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  tags: string[];
}

export interface ProjectOrder {
  id: string;
  orderNumber: string; // e.g. PO-8921
  buyerName: string;
  styleName: string;
  storeRef: string;
  totalBookingKg: number;
  receivedKg: number;
  deliveredKg: number;
  cuttingTargetPcs: number;
  status: 'Planning' | 'Fabric Receiving' | 'Cutting In Progress' | 'Inspection' | 'Ready for Export' | 'Completed';
  progressPercent: number;
  shipmentDate: string;
  manager: string;
  updatedAt: string;
}

export interface RealtimeProjectUpdate {
  id: string;
  timestamp: string;
  type: 'FABRIC_RECEIVED' | 'DELIVERY_DISPATCHED' | 'TRANSFER_DONE' | 'TASK_UPDATED' | 'QUALITY_ALERT' | 'PROJECT_MILESTONE';
  title: string;
  description: string;
  author: string;
  metadata?: Record<string, any>;
}

export interface DropdownMasterData {
  warehouseName: string[];
  buyerName: string[];
  styleName: string[];
  storeRef: string[];
  fabricsType: string[];
  certificateName: string[];
  colour: string[];
  location: string[];
  personOfCutting: string[];
  composition: string[];
  monthName: string[];
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  department: string;
  token?: string;
}

export type BarcodeEntityType = 'ROLL' | 'RACK' | 'BATCH' | 'MRR' | 'DELIVERY' | 'SR' | 'UNKNOWN';

export interface RollBarcodeItem {
  rollId: string;
  barcode: string;
  rollNumber: number;
  totalRolls: number;
  mrrNo: string;
  storeRef: string;
  batchNo: string;
  buyerName: string;
  styleName: string;
  fabricsType: string;
  colour: string;
  gsm: string;
  weightKg: number;
  location: string;
  dia?: string;
  status: 'IN_STOCK' | 'ISSUED' | 'TRANSFER';
}

export interface BarcodeScanResult {
  rawCode: string;
  type: BarcodeEntityType;
  entityId: string;
  timestamp: string;
  matchedFabric?: FabricRecord;
  matchedRack?: string;
  matchedDelivery?: DeliveryRecord;
  notes?: string;
}

export interface BarcodeScanLogEntry {
  id: string;
  code: string;
  type: BarcodeEntityType;
  entityName: string;
  operator: string;
  timestamp: string;
  actionTaken: string;
}
