import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BusinessCard } from '../types/card';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId as required by AI Studio skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling per Firestore Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection per Firestore Skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Connected to Firebase Firestore successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting. Check Firebase configuration.');
      return false;
    }
    // Non-fatal if test doc doesn't exist yet
    return true;
  }
}

// Initial connection test
testFirestoreConnection();

const CARDS_COLLECTION = 'cards';

// 1. Fetch all cards from Firestore
export async function getCardsFromFirestore(): Promise<BusinessCard[]> {
  try {
    const q = query(collection(db, CARDS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const cards: BusinessCard[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      cards.push({
        id: docSnap.id,
        name: data.name || '',
        companyName: data.companyName || '',
        position: data.position || '',
        email: data.email || '',
        phone: data.phone || '',
        lineId: data.lineId || '',
        website: data.website || '',
        address: data.address || '',
        notes: data.notes || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });
    return cards;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CARDS_COLLECTION);
    return [];
  }
}

// 2. Real-time listener for Firestore cards
export function subscribeToFirestoreCards(
  onUpdate: (cards: BusinessCard[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, CARDS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const cards: BusinessCard[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cards.push({
          id: docSnap.id,
          name: data.name || '',
          companyName: data.companyName || '',
          position: data.position || '',
          email: data.email || '',
          phone: data.phone || '',
          lineId: data.lineId || '',
          website: data.website || '',
          address: data.address || '',
          notes: data.notes || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          imageUrl: data.imageUrl || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onUpdate(cards);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, CARDS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

// 3. Save a new card to Firestore
export async function saveCardToFirestore(
  card: Omit<BusinessCard, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessCard> {
  const cardId = 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();

  const newCard: BusinessCard = {
    id: cardId,
    name: (card.name || '').trim(),
    companyName: (card.companyName || '').trim(),
    position: (card.position || '').trim(),
    email: (card.email || '').trim(),
    phone: (card.phone || '').trim(),
    lineId: (card.lineId || '').trim(),
    website: (card.website || '').trim(),
    address: (card.address || '').trim(),
    notes: (card.notes || '').trim(),
    tags: Array.isArray(card.tags) ? card.tags : [],
    imageUrl: card.imageUrl || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, CARDS_COLLECTION, cardId), newCard);
    return newCard;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CARDS_COLLECTION}/${cardId}`);
    throw error;
  }
}

// 4. Update an existing card in Firestore
export async function updateCardInFirestore(
  id: string,
  cardUpdates: Partial<BusinessCard>
): Promise<BusinessCard> {
  const path = `${CARDS_COLLECTION}/${id}`;
  const now = new Date().toISOString();

  const payload: any = {
    ...cardUpdates,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, CARDS_COLLECTION, id), payload, { merge: true });
    return {
      id,
      ...cardUpdates,
      updatedAt: now,
    } as BusinessCard;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// 5. Delete card from Firestore
export async function deleteCardFromFirestore(id: string): Promise<boolean> {
  const path = `${CARDS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CARDS_COLLECTION, id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// 6. Seed demo cards into Firestore if database is empty
export async function seedFirestoreCardsIfEmpty(seedCards: BusinessCard[]): Promise<BusinessCard[]> {
  try {
    const existing = await getCardsFromFirestore();
    if (existing.length === 0) {
      console.log('Seeding initial business cards into Firebase Firestore...');
      for (const card of seedCards) {
        await setDoc(doc(db, CARDS_COLLECTION, card.id), card);
      }
      return seedCards;
    }
    return existing;
  } catch (err) {
    console.warn('Seeding check warning:', err);
    return [];
  }
}
