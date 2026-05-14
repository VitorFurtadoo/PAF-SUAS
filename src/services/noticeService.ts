import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Notice } from '../types';

const COLLECTION_NAME = 'notices';

export const getNotices = (activeOnly = true, callback: (notices: Notice[]) => void) => {
  let q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );

  if (activeOnly) {
    q = query(
      collection(db, COLLECTION_NAME),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
  }

  return onSnapshot(q, (snapshot) => {
    const notices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notice[];
    callback(notices);
  }, (error) => {
    console.error("Error fetching notices:", error);
  });
};

export const saveNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
  return addDoc(collection(db, COLLECTION_NAME), {
    ...notice,
    createdAt: serverTimestamp()
  });
};

export const updateNotice = async (id: string, notice: Partial<Notice>) => {
  const noticeRef = doc(db, COLLECTION_NAME, id);
  return updateDoc(noticeRef, {
    ...notice,
    updatedAt: serverTimestamp()
  });
};

export const deleteNotice = async (id: string) => {
  return deleteDoc(doc(db, COLLECTION_NAME, id));
};
