import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../types';
import { sanitizeData } from '../lib/utils';

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  }
  return null;
};

export const getUsersByCras = async (unidadeCras: string): Promise<UserProfile[]> => {
  if (!unidadeCras || unidadeCras === 'Todas') {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  }
  
  const q = query(collection(db, 'users'), where('unidadeCras', '==', unidadeCras));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
};

export const createUserProfile = async (userId: string, profile: Omit<UserProfile, 'id' | 'createdAt'>) => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, sanitizeData({
    ...profile,
    createdAt: serverTimestamp(),
  }));
};
