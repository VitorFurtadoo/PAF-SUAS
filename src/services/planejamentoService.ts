import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { PlanejamentoInstrumental, UserProfile } from '../types';
import { sanitizeData } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export const savePlanejamento = async (data: Omit<PlanejamentoInstrumental, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'planejamentos'), sanitizeData({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'planejamentos');
  }
};

export const updatePlanejamento = async (id: string, data: Partial<PlanejamentoInstrumental>) => {
  try {
    const docRef = doc(db, 'planejamentos', id);
    await updateDoc(docRef, sanitizeData({
      ...data,
      updatedAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `planejamentos/${id}`);
  }
};

export const deletePlanejamento = async (id: string) => {
  try {
    const docRef = doc(db, 'planejamentos', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `planejamentos/${id}`);
  }
};

export const getPlanejamentos = async (userProfile: UserProfile) => {
  try {
    let q;
    // Admins see everything, others see only their CRAS
    if (userProfile.role === 'ADMIN') {
      q = query(collection(db, 'planejamentos'), orderBy('data', 'asc'));
    } else {
      q = query(
        collection(db, 'planejamentos'),
        where('unidadeCras', '==', userProfile.unidadeCras),
        orderBy('data', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const planejamentos: PlanejamentoInstrumental[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as any;
      planejamentos.push({ id: doc.id, ...data } as PlanejamentoInstrumental);
    });
    
    return planejamentos;
  } catch (error) {
    console.error('Error getting planejamentos: ', error);
    // If it's a missing index error, fallback to un-ordered fetch
    try {
      const qFallback = query(collection(db, 'planejamentos'));
      const querySnapshot = await getDocs(qFallback);
      const planejamentos: PlanejamentoInstrumental[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        planejamentos.push({ id: doc.id, ...data } as PlanejamentoInstrumental);
      });
      return planejamentos;
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.GET, 'planejamentos');
      return [];
    }
  }
};
