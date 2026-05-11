import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import type { AcaoCras } from '../types';

const COLLECTION_NAME = 'acoesCras';

export const saveAcaoCras = async (data: Omit<AcaoCras, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const updateAcaoCras = async (id: string, data: Partial<AcaoCras>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  return await updateDoc(docRef, data);
};

export const getAcoesCras = async (unidadeCras?: string) => {
  let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  if (unidadeCras && unidadeCras !== 'Todas') {
    q = query(
      collection(db, COLLECTION_NAME), 
      where('unidadeCras', '==', unidadeCras),
      orderBy('createdAt', 'desc')
    );
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as AcaoCras[];
};

export const deleteAcaoCras = async (id: string) => {
  return await deleteDoc(doc(db, COLLECTION_NAME, id));
};
