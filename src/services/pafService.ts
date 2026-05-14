import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import type { PAFData, UserProfile } from '../types';
import { sanitizeData } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export const savePAF = async (userId: string, userName: string, data: PAFData) => {
  try {
    const historyEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      userId,
      userName,
      action: 'Criação',
      summary: data.isDraft ? 'Rascunho criado' : 'PAF criado'
    };

    const docRef = await addDoc(collection(db, 'pafs'), sanitizeData({
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [historyEntry]
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'pafs');
  }
};

export const updatePAF = async (pafId: string, userId: string, userName: string, data: Partial<PAFData>, explicitAction?: string) => {
  try {
    const pafRef = doc(db, 'pafs', pafId);
    
    const historyEntry = sanitizeData({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      userId,
      userName,
      action: explicitAction || 'Edição',
      summary: data.isDraft ? 'Rascunho atualizado' : 'Dados do PAF atualizados'
    });

    await updateDoc(pafRef, sanitizeData({
      ...data,
      updatedAt: serverTimestamp(),
      history: arrayUnion(historyEntry)
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `pafs/${pafId}`);
  }
};

export const updatePAFTasks = async (pafId: string, tasks: any[]) => {
  try {
    const pafRef = doc(db, 'pafs', pafId);
    await updateDoc(pafRef, sanitizeData({
      tasks,
      updatedAt: serverTimestamp()
    }));
  } catch (error) {
    console.error('Error updating tasks: ', error);
    throw error;
  }
};

export const updatePAFVisit = async (pafId: string, userId: string, userName: string, visitHistoryEntry: any, nextVisitData?: { data?: string, hora?: string, obs?: string }) => {
  try {
    const pafRef = doc(db, 'pafs', pafId);
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
      visitasHistory: arrayUnion(sanitizeData(visitHistoryEntry))
    };

    if (nextVisitData) {
      updateData.proximaVisitaData = nextVisitData.data || null;
      updateData.proximaVisitaHora = nextVisitData.hora || null;
      updateData.proximaVisitaObservacoes = nextVisitData.obs || null;
    } else {
      updateData.proximaVisitaData = null;
      updateData.proximaVisitaHora = null;
      updateData.proximaVisitaObservacoes = null;
    }

    const historyEntry = sanitizeData({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      userId,
      userName,
      action: 'Visita',
      summary: `Visita ${visitHistoryEntry.status}: ${visitHistoryEntry.motivo || 'Sem observações'}`
    });
    
    updateData.history = arrayUnion(historyEntry);

    await updateDoc(pafRef, sanitizeData(updateData));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `pafs/${pafId}`);
  }
};

export const softDeletePAF = async (pafId: string) => {
  try {
    const pafRef = doc(db, 'pafs', pafId);
    await updateDoc(pafRef, {
      deletedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error soft deleting document: ', error);
    throw error;
  }
};

export const restorePAF = async (pafId: string) => {
  try {
    const pafRef = doc(db, 'pafs', pafId);
    await updateDoc(pafRef, {
      deletedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring document: ', error);
    throw error;
  }
};

export const permanentlyDeletePAF = async (pafId: string) => {
  try {
    const pafRef = doc(db, 'pafs', pafId);
    await deleteDoc(pafRef);
  } catch (error) {
    console.error('Error permanently deleting document: ', error);
    throw error;
  }
};

export const getPAFs = async (userProfile: UserProfile, userId: string) => {
  try {
    let q;
    if (userProfile.role === 'ADMIN') {
      q = query(collection(db, 'pafs'));
    } else if (userProfile.role === 'COORDENADOR' || userProfile.role === 'TECNICO') {
      q = query(
        collection(db, 'pafs'),
        where('unidadeCras', '==', userProfile.unidadeCras)
      );
    } else {
      // Outros casos (ex: se houvesse usuários externos)
      q = query(
        collection(db, 'pafs'),
        where('userId', '==', userId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    let pafs: any[] = [];
    
    querySnapshot.forEach((document) => {
      pafs.push({ id: document.id, ...(document.data() as object) });
    });
    
    // Auto-delete PAFs in trash older than 30 days
    const now = new Date();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    
    const validPafs = [];
    for (const paf of pafs) {
      if (paf.deletedAt) {
        const deletedTime = new Date(paf.deletedAt).getTime();
        if (now.getTime() - deletedTime > thirtyDaysInMs) {
          // Permanently delete
          try {
            await permanentlyDeletePAF(paf.id);
          } catch (e) {
            console.error('Failed to auto-delete expired PAF:', paf.id, e);
            validPafs.push(paf); // keep it if fail to delete to avoid silent loss
          }
        } else {
          validPafs.push(paf);
        }
      } else {
        validPafs.push(paf);
      }
    }

    // Sort locally by createdAt desc
    return validPafs.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  } catch (error) {
    console.error('Error getting documents: ', error);
    throw error;
  }
};

export const getNextPlanNumber = async (crasUnit: string) => {
  try {
    if (!crasUnit) return '';
    const year = new Date().getFullYear().toString();
    const q = query(
      collection(db, 'pafs'),
      where('unidadeCras', '==', crasUnit)
    );
    
    const querySnapshot = await getDocs(q);
    let count = 0;
    
    // We filter by year locally or could add another where clause if we store year separately
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only count if it's from the same year and not deleted (or even if deleted to keep sequence)
      // Actually, checking the numeroPlano format to find the highest number is safer
      const numPlano = data.numeroPlano as string;
      if (numPlano && numPlano.includes(`/${year}`)) {
        count++;
      }
    });

    const nextNum = (count + 1).toString().padStart(3, '0');
    return `${nextNum}/${year}`;
  } catch (error) {
    console.error('Error calculating next plan number:', error);
    return '';
  }
};

export const searchPAFByCPF = async (cpf: string, userProfile: UserProfile) => {
  try {
    if (!cpf) return null;
    
    let qExact;
    if (userProfile.role === 'ADMIN') {
      qExact = query(
        collection(db, 'pafs'),
        where('cpf', '==', cpf)
      );
    } else {
      qExact = query(
        collection(db, 'pafs'),
        where('cpf', '==', cpf),
        where('unidadeCras', '==', userProfile.unidadeCras)
      );
    }
    
    const querySnapshot = await getDocs(qExact);
    
    // Filter out deleted ones manually to avoid field existence issues in index
    const results = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(paf => !paf.deletedAt);
    
    if (results.length === 0) return null;
    
    // Return the most recent one
    return results.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || 0;
      return bTime - aTime;
    })[0];
  } catch (error) {
    console.error('Error searching PAF by CPF:', error);
    return null;
  }
};
