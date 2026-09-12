import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { mockUsers, mockStudents } from '../services/mockData';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface RegisterTeacherData {
  nombre: string;
  apellidos?: string;
  email: string;
  password: string;
  colegio: string;
  grupo?: string;
  ciclo?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  registerTeacher: (data: RegisterTeacherData) => Promise<void>;
  loginAsParentWithStudent: (curpOrCode: string) => Promise<{ success: boolean; error?: string; student?: any }>;
  loginAs: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('lumni_is_authenticated') === 'true';
  });

  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('lumni_active_role') as UserRole) || 'teacher';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const isAuth = localStorage.getItem('lumni_is_authenticated') === 'true';
    if (!isAuth) return null;
    const savedRole = (localStorage.getItem('lumni_active_role') as UserRole) || 'teacher';
    const saved = localStorage.getItem(`lumni_user_${savedRole}`);
    return saved ? JSON.parse(saved) : mockUsers[savedRole] || mockUsers.teacher;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      const saved = localStorage.getItem(`lumni_user_${role}`);
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      } else {
        setCurrentUser(mockUsers[role] || mockUsers.teacher);
      }
      localStorage.setItem('lumni_active_role', role);
      localStorage.setItem('lumni_is_authenticated', 'true');
    } else {
      setCurrentUser(null);
      localStorage.removeItem('lumni_is_authenticated');
    }
  }, [role, isAuthenticated]);

  const loginAs = (selectedRole: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      setRole(selectedRole);
      const user = mockUsers[selectedRole] || mockUsers.teacher;
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('lumni_is_authenticated', 'true');
      localStorage.setItem('lumni_active_role', selectedRole);
      localStorage.setItem(`lumni_user_${selectedRole}`, JSON.stringify(user));
      setIsLoading(false);
    }, 400);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const fbUser = userCredential.user;

        let userProfile: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || email,
          nombre: fbUser.displayName || 'Profesor(a)',
          rol: 'teacher',
          colegio: 'Colegio Lumni',
          ciclo: '2026-2027',
        };

        // Try reading Firestore user profile if exists
        if (db) {
          try {
            const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDocSnap.exists()) {
              userProfile = { ...userProfile, ...(userDocSnap.data() as UserProfile) };
            }
          } catch (e) {
            console.warn('Could not read user profile from Firestore:', e);
          }
        }

        setRole('teacher');
        setCurrentUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem('lumni_is_authenticated', 'true');
        localStorage.setItem('lumni_active_role', 'teacher');
        localStorage.setItem('lumni_user_teacher', JSON.stringify(userProfile));
        setIsLoading(false);
        return;
      } catch (err: any) {
        console.warn('Firebase login failed, checking local credentials:', err);
        // Throw proper error if Firebase was intentionally used
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          setIsLoading(false);
          throw new Error('Correo o contraseña incorrectos en Firebase Auth.');
        }
      }
    }

    // Modo Local / Demo Fallback
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Determinar rol por correo (Maestro o Tutor)
    let detectedRole: UserRole = 'teacher';
    if (email.includes('tutor') || email.includes('soto') || email.includes('padre') || email.includes('familiar')) {
      detectedRole = 'parent';
    }

    setRole(detectedRole);
    const user = mockUsers[detectedRole] || mockUsers.teacher;
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('lumni_is_authenticated', 'true');
    localStorage.setItem('lumni_active_role', detectedRole);
    localStorage.setItem(`lumni_user_${detectedRole}`, JSON.stringify(user));
    setIsLoading(false);
  };

  const registerTeacher = async (data: RegisterTeacherData) => {
    setIsLoading(true);

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const fbUser = userCredential.user;

        const fullName = `${data.nombre} ${data.apellidos || ''}`.trim();
        await updateFirebaseProfile(fbUser, {
          displayName: fullName,
        });

        const newProfile: UserProfile = {
          id: fbUser.uid,
          email: data.email,
          nombre: data.nombre,
          apellidos: data.apellidos || '',
          rol: 'teacher',
          colegio: data.colegio || 'Colegio Lumni',
          grupo: data.grupo || '3° B',
          ciclo: data.ciclo || '2026-2027',
          maxAlumnos: 45,
          suscripcion: {
            estado: 'activa',
            plan: 'Docente Pro',
            pagoInicial: 250,
            mensualidad: 50,
            fechaInicio: new Date().toISOString().split('T')[0],
            proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            ultimoPagoMonto: 250,
            mesesActivo: 1,
          },
          createdAt: new Date().toISOString(),
        };

        if (db) {
          try {
            await setDoc(doc(db, 'users', fbUser.uid), newProfile);
          } catch (errDoc) {
            console.warn('Could not write user profile to Firestore:', errDoc);
          }
        }

        setRole('teacher');
        setCurrentUser(newProfile);
        setIsAuthenticated(true);
        localStorage.setItem('lumni_user_teacher', JSON.stringify(newProfile));
        localStorage.setItem('lumni_is_authenticated', 'true');
        localStorage.setItem('lumni_active_role', 'teacher');
        setIsLoading(false);
        return;
      } catch (err: any) {
        setIsLoading(false);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error('Este correo ya está registrado. Por favor inicia sesión.');
        } else if (err.code === 'auth/weak-password') {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        } else {
          throw new Error(err.message || 'Error al registrar la cuenta de docente.');
        }
      }
    }

    // Modo Local / Demo Fallback
    await new Promise((resolve) => setTimeout(resolve, 600));
    const localProfile: UserProfile = {
      id: `tea_${Date.now()}`,
      email: data.email,
      nombre: data.nombre,
      apellidos: data.apellidos || '',
      rol: 'teacher',
      colegio: data.colegio || 'Colegio Lumni',
      grupo: data.grupo || '3° B',
      ciclo: data.ciclo || '2026-2027',
      maxAlumnos: 45,
      suscripcion: {
        estado: 'activa',
        plan: 'Docente Pro',
        pagoInicial: 250,
        mensualidad: 50,
        fechaInicio: new Date().toISOString().split('T')[0],
        proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ultimoPagoMonto: 250,
        mesesActivo: 1,
      },
      createdAt: new Date().toISOString(),
    };

    setRole('teacher');
    setCurrentUser(localProfile);
    setIsAuthenticated(true);
    localStorage.setItem('lumni_user_teacher', JSON.stringify(localProfile));
    localStorage.setItem('lumni_is_authenticated', 'true');
    localStorage.setItem('lumni_active_role', 'teacher');
    setIsLoading(false);
  };

  const loginAsParentWithStudent = async (curpOrCode: string): Promise<{ success: boolean; error?: string; student?: any }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanInput = curpOrCode.trim().toUpperCase();
    if (!cleanInput) {
      setIsLoading(false);
      return { success: false, error: 'Por favor ingresa la CURP o Matrícula del alumno.' };
    }

    // Buscar entre los alumnos guardados o los mock
    const savedStudents = localStorage.getItem('lumni_students_v2');
    const studentList = savedStudents ? JSON.parse(savedStudents) : mockStudents;

    const matched = studentList.find(
      (s: any) =>
        (s.curp && s.curp.toUpperCase() === cleanInput) ||
        (s.matricula && s.matricula.toUpperCase() === cleanInput) ||
        (s.id && s.id.toUpperCase() === cleanInput)
    );

    if (!matched) {
      setIsLoading(false);
      return {
        success: false,
        error: `No se encontró ningún estudiante con la clave o CURP "${cleanInput}". Verifica los datos con el docente.`,
      };
    }

    const parentProfile: UserProfile = {
      id: `parent_${matched.id}`,
      nombre: matched.tutorNombre || `Tutor de ${matched.nombre}`,
      email: matched.tutorEmail || `${matched.curp.toLowerCase()}@tutor.lumni`,
      rol: 'parent',
      colegio: 'Colegio Lumni',
      ciclo: '2026-2027',
      studentId: matched.id,
    };

    setRole('parent');
    setCurrentUser(parentProfile);
    setIsAuthenticated(true);
    localStorage.setItem('lumni_is_authenticated', 'true');
    localStorage.setItem('lumni_active_role', 'parent');
    localStorage.setItem('lumni_user_parent', JSON.stringify(parentProfile));
    localStorage.setItem('lumni_parent_student_id', matched.id);

    setIsLoading(false);
    return { success: true, student: matched };
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  const logout = async () => {
    setIsLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Error signing out from Firebase', e);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('lumni_is_authenticated');
    localStorage.removeItem('lumni_parent_student_id');
    setIsLoading(false);
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
        return true;
      } catch (err) {
        console.error('Firebase password reset error:', err);
      }
    }
    // Simular envío exitoso en modo Demo
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(`lumni_user_${role}`, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isLoading,
        login,
        registerTeacher,
        loginAsParentWithStudent,
        loginAs,
        switchRole,
        logout,
        sendPasswordReset,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

