import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

/**
 * Busca todos os usuários de uma unidade específica
 */
export async function getTeclicosPorUnidade(unidadeCras: string): Promise<UserProfile[]> {
  if (unidadeCras === 'Administração') return getAllUsers();
  
  const path = 'users';
  try {
    const q = query(
      collection(db, path),
      where('unidadeCras', '==', unidadeCras),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Busca todos os usuários do sistema (Geral/Admin)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(
      collection(db, path),
      orderBy('unidadeCras', 'asc'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Atualiza o cargo/role de um usuário
 */
export async function updateUserRole(userId: string, newRole: 'TECNICO' | 'COORDENADOR' | 'ADMIN'): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Atualiza a unidade de um usuário
 */
export async function updateUserUnit(userId: string, newUnit: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { unidadeCras: newUnit });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Busca um perfil de usuário pelo ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
