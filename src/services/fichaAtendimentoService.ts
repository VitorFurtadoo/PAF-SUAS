import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { FichaAtendimento } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

import { sanitizeData } from '../lib/utils';

const COLLECTION_NAME = 'fichas_atendimento';

export const saveFichaAtendimento = async (data: FichaAtendimento) => {
  try {
    const isUpdate = !!data.id;
    const docData = sanitizeData({
      ...data,
      updatedAt: serverTimestamp(),
    });

    if (!isUpdate) {
      docData.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      return { ...data, id: docRef.id };
    } else {
      const { id, ...updateFields } = docData;
      await updateDoc(doc(db, COLLECTION_NAME, id!), updateFields);
      return data;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
};

export const getFichasAtendimento = async (crasUnit?: string) => {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('dataAtendimento', 'desc'));
    
    if (crasUnit && crasUnit !== 'Administração') {
      q = query(
        collection(db, COLLECTION_NAME), 
        where('unidadeCras', '==', crasUnit),
        orderBy('dataAtendimento', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as FichaAtendimento[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
};

export const deleteFichaAtendimento = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};
