import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type User } from '../types/index';

export class UserService {
  private static collectionName = 'users';

  // ========================================
  // GESTIÓN DE USUARIOS
  // ========================================

  // Crear usuario en la base de datos
  static async createUser(uid: string, userData: Partial<User>): Promise<void> {
    try {
      const userDoc = {
        uid,
        email: userData.email || '',
        firstName: userData.firstName || 'Usuario',
        lastName: userData.lastName || 'Sistema',
        displayName: userData.displayName || `${userData.firstName || 'Usuario'} ${userData.lastName || 'Sistema'}`,
        photoURL: userData.photoURL || null,
        role: userData.role || 'super-admin', // Cambiado de 'viewer' a 'super-admin'
        department: userData.department || 'General',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(doc(db, this.collectionName, uid), userDoc);
      console.log('✅ Usuario creado en base de datos:', uid);
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw new Error('Error al crear usuario');
    }
  }

  // Obtener usuario por UID
  static async getUserById(uid: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, uid));

      if (docSnap.exists()) {
        return this.mapDocumentToUser(docSnap);
      }

      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Error al obtener usuario');
    }
  }

  // Actualizar usuario
  static async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        lastLogin: serverTimestamp(),
      };

      await updateDoc(doc(db, this.collectionName, uid), updateData);
      console.log('✅ Usuario actualizado:', uid);
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      throw new Error('Error al actualizar usuario');
    }
  }

  // Obtener rol del usuario
  static async getUserRole(uid: string): Promise<string> {
    try {
      const user = await this.getUserById(uid);
      return user?.role || 'viewer';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'viewer';
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  private static mapDocumentToUser(doc: QueryDocumentSnapshot<DocumentData>): User {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email || '',
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: data.role || 'viewer',
      department: data.department,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : new Date(),
    };
  }
}
