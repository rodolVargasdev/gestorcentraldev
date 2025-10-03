import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { type User } from '../types/index';
import { UserService } from './userService';

export class AuthService {
  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Obtener datos del usuario desde la base de datos
      const userData = await UserService.getUserById(firebaseUser.uid);

      // Si no existe en la BD, crear un usuario básico
      if (!userData) {
        await UserService.createUser(firebaseUser.uid, {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          role: 'super-admin', // Cambiado a super-admin por defecto
          createdAt: new Date(),
          lastLogin: new Date()
        });

        // Obtener el usuario recién creado
        const newUserData = await UserService.getUserById(firebaseUser.uid);
        if (newUserData) {
          // Actualizar lastLogin
          await UserService.updateUser(firebaseUser.uid, { lastLogin: new Date() });
          return newUserData;
        }
      }

      // Actualizar lastLogin y retornar usuario existente
      if (userData) {
        await UserService.updateUser(firebaseUser.uid, { lastLogin: new Date() });
        return userData;
      }

      // Fallback por si algo sale mal
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        role: 'super-admin', // Cambiado a super-admin por defecto
        createdAt: new Date(),
        lastLogin: new Date()
      };

      return user;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Obtener datos del usuario desde la base de datos
          const userData = await UserService.getUserById(firebaseUser.uid);

          if (userData) {
            callback(userData);
          } else {
            // Si no existe en BD, crear usuario básico
            await UserService.createUser(firebaseUser.uid, {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              role: 'super-admin', // Cambiado a super-admin por defecto
              createdAt: new Date(),
              lastLogin: new Date()
            });

            const newUserData = await UserService.getUserById(firebaseUser.uid);
            callback(newUserData || null);
          }
        } catch (error) {
          console.error('Error obteniendo datos de usuario:', error);
          // Fallback básico
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            role: 'super-admin', // Cambiado a super-admin por defecto
            createdAt: new Date(),
            lastLogin: new Date()
          };
          callback(user);
        }
      } else {
        callback(null);
      }
    });
  }
}
