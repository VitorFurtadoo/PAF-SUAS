import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Suggestion } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { sanitizeData } from '../lib/utils';

/**
 * Envia uma nova sugestão
 */
export async function addSuggestion(suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const path = 'suggestions';
  try {
    const docRef = await addDoc(collection(db, path), sanitizeData({
      ...suggestion,
      status: 'PENDENTE',
      createdAt: serverTimestamp()
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return ''; // Unreachable due to handleFirestoreError throwing
  }
}

/**
 * Busca todas as sugestões (ordenadas por data)
 */
export async function getSuggestions(): Promise<Suggestion[]> {
  const path = 'suggestions';
  try {
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Suggestion));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Busca sugestões de um usuário específico
 */
export async function getSuggestionsByUser(userId: string): Promise<Suggestion[]> {
  const path = 'suggestions';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Suggestion));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Atualiza o status de uma sugestão (Coordenador/Admin)
 */
export async function updateSuggestionStatus(suggestionId: string, status: Suggestion['status']): Promise<void> {
  const path = `suggestions/${suggestionId}`;
  try {
    const docRef = doc(db, 'suggestions', suggestionId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Exclui uma sugestão
 */
export async function deleteSuggestion(suggestionId: string): Promise<void> {
  const path = `suggestions/${suggestionId}`;
  try {
    const docRef = doc(db, 'suggestions', suggestionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
