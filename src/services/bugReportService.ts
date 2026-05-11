import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export interface BugReport {
  userId: string;
  userEmail: string;
  userName: string;
  description: string;
  type: 'bug' | 'suggestion' | 'question';
  pageUrl: string;
  userAgent: string;
  createdAt: any;
  status: 'new' | 'investigating' | 'fixed' | 'closed';
}

export const submitErrorReport = async (description: string, type: BugReport['type']) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    const report: Omit<BugReport, 'id'> = {
      userId: user.uid,
      userEmail: user.email || 'N/A',
      userName: user.displayName || 'Usuário',
      description,
      type,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
      status: 'new'
    };

    const docRef = await addDoc(collection(db, 'bug_reports'), report);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'bug_reports');
  }
};

export const getBugReports = async () => {
  try {
    const q = query(
      collection(db, 'bug_reports'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (BugReport & { id: string })[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'bug_reports');
    return [];
  }
};

export const updateBugReportStatus = async (reportId: string, status: BugReport['status']) => {
  try {
    const docRef = doc(db, 'bug_reports', reportId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `bug_reports/${reportId}`);
  }
};
