import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, setDoc, getDocs, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { getDatabase, Database, ref, set, get, onValue } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';
import type { FabricRecord, DeliveryRecord, OrderTransferRecord, DropdownMasterData } from '../types.js';

// User's Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAh30KKX3IGoov17aZCsu9LbrPG2FMvrxY",
  authDomain: "stock-finish-fabric-f8040.firebaseapp.com",
  databaseURL: "https://stock-finish-fabric-f8040-default-rtdb.firebaseio.com",
  projectId: "stock-finish-fabric-f8040",
  storageBucket: "stock-finish-fabric-f8040.firebasestorage.app",
  messagingSenderId: "270008672792",
  appId: "1:270008672792:web:6337ba009661e2fa92596d",
  measurementId: "G-LMM8VL1BYC"
};

// Singleton Firebase initialization
let app: FirebaseApp;
let db: Firestore | null = null;
let rtdb: Database | null = null;
let auth: Auth | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  rtdb = getDatabase(app);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization warning:', error);
  // fallback placeholder app
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export { app, db, rtdb, auth };

/**
 * Cloud Sync Helpers
 * Persist records to Firebase Firestore & Realtime Database
 */
export async function syncFabricRecordToFirebase(record: FabricRecord): Promise<void> {
  try {
    if (db && record.id) {
      await setDoc(doc(db, 'fabricRecords', record.id), record, { merge: true });
    }
    if (rtdb && record.id) {
      await set(ref(rtdb, `fabricRecords/${record.id}`), record);
    }
  } catch (err) {
    console.warn('Firebase fabric record sync error:', err);
  }
}

export async function syncDeliveryRecordToFirebase(record: DeliveryRecord): Promise<void> {
  try {
    if (db && record.id) {
      await setDoc(doc(db, 'deliveryRecords', record.id), record, { merge: true });
    }
    if (rtdb && record.id) {
      await set(ref(rtdb, `deliveryRecords/${record.id}`), record);
    }
  } catch (err) {
    console.warn('Firebase delivery record sync error:', err);
  }
}

export async function syncTransferRecordToFirebase(record: OrderTransferRecord): Promise<void> {
  try {
    if (db && record.id) {
      await setDoc(doc(db, 'transferRecords', record.id), record, { merge: true });
    }
    if (rtdb && record.id) {
      await set(ref(rtdb, `transferRecords/${record.id}`), record);
    }
  } catch (err) {
    console.warn('Firebase transfer record sync error:', err);
  }
}

export async function syncRackAuditToFirebase(audit: {
  id: string;
  rackId: string;
  rackName: string;
  auditedBy: string;
  physicalKg: number;
  physicalRolls: number;
  systemKg: number;
  systemRolls: number;
  discrepancyNote?: string;
  timestamp: string;
}): Promise<void> {
  try {
    if (db && audit.id) {
      await setDoc(doc(db, 'rackAudits', audit.id), audit, { merge: true });
    }
    if (rtdb && audit.id) {
      await set(ref(rtdb, `rackAudits/${audit.id}`), audit);
    }
  } catch (err) {
    console.warn('Firebase rack audit sync error:', err);
  }
}

export async function syncDropdownsToFirebase(dropdowns: DropdownMasterData): Promise<void> {
  try {
    if (db) {
      await setDoc(doc(db, 'settings', 'dropdowns'), dropdowns, { merge: true });
    }
    if (rtdb) {
      await set(ref(rtdb, 'settings/dropdowns'), dropdowns);
    }
  } catch (err) {
    console.warn('Firebase dropdown sync error:', err);
  }
}

/**
 * Bulk Backup to Firebase
 */
export async function bulkBackupToFirebase(data: {
  fabricRecords: FabricRecord[];
  deliveryRecords: DeliveryRecord[];
  transferRecords: OrderTransferRecord[];
}): Promise<{ success: boolean; count: number; message: string }> {
  let count = 0;
  try {
    for (const f of data.fabricRecords) {
      await syncFabricRecordToFirebase(f);
      count++;
    }
    for (const d of data.deliveryRecords) {
      await syncDeliveryRecordToFirebase(d);
      count++;
    }
    for (const t of data.transferRecords) {
      await syncTransferRecordToFirebase(t);
      count++;
    }
    return { success: true, count, message: `Successfully synchronized ${count} records to Firebase Cloud Database (stock-finish-fabric-f8040).` };
  } catch (err: any) {
    return { success: false, count, message: err?.message || 'Sync failed' };
  }
}
