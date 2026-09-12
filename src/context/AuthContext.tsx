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
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      const saved = localStorage.getItem(`lumni_user_${role}`);
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch {
          setCurrentUser(mockUsers[role] || mockUsers.teacher);
        }
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
      if (selectedRole === 'parent') {
        localStorage.setItem('lumni_parent_scope_id', 'demo');
        localStorage.setItem('lumni_parent_student_id', 'stu_01');
      }
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

        // Leer perfil del usuario en Firestore si existe
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
        console.warn('Firebase login check:', err);
        if (
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-email'
        ) {
          setIsLoading(false);
          throw new Error('Correo o contraseña incorrectos.');
        }
      }
    }

    // Modo Local / Fallback para cualquier correo real
    await new Promise((resolve) => setTimeout(resolve, 300));

    const isExplicitCarlosDemo = email.toLowerCase() === 'carlos.mendoza@colegio.edu.mx';
    const isExplicitLauraDemo = email.toLowerCase() === 'laura.soto@correo.com';

    let user: UserProfile;
    if (isExplicitCarlosDemo) {
      user = mockUsers.teacher;
      setRole('teacher');
    } else if (isExplicitLauraDemo) {
      user = mockUsers.parent;
      setRole('parent');
    } else {
      // Crear cuenta limpia con su propio correo y nombre
      const userCleanId = `tea_${email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
      user = {
        id: userCleanId,
        email: email,
        nombre: email.split('@')[0],
        apellidos: '',
        rol: 'teacher',
        colegio: 'Colegio Lumni',
        grupo: '3° A',
        ciclo: '2026-2027',
        maxAlumnos: 50,
      };
      setRole('teacher');
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('lumni_is_authenticated', 'true');
    localStorage.setItem('lumni_active_role', user.rol);
    localStorage.setItem(`lumni_user_${user.rol}`, JSON.stringify(user));
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
          maxAlumnos: 50,
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
          throw new Error('Este correo ya está registrado. Por favor inicia sesión con tu contraseña.');
        } else if (err.code === 'auth/weak-password') {
          throw new Error('La contraseña debe contener al menos 6 caracteres.');
        } else {
          throw new Error(err.message || 'Error al registrar la cuenta de docente.');
        }
      }
    }

    // Modo Local / Offline Fallback
    await new Promise((resolve) => setTimeout(resolve, 500));
    const localProfile: UserProfile = {
      id: `tea_${Date.now()}`,
      email: data.email,
      nombre: data.nombre,
      apellidos: data.apellidos || '',
      rol: 'teacher',
      colegio: data.colegio || 'Colegio Lumni',
      grupo: data.grupo || '3° B',
      ciclo: data.ciclo || '2026-2027',
      maxAlumnos: 50,
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
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanInput = curpOrCode.trim().toUpperCase();
    if (!cleanInput) {
      setIsLoading(false);
      return { success: false, error: 'Por favor ingresa la CURP o Matrícula del alumno.' };
    }

    let foundStudent: any = null;
    let foundTeacherId = 'demo';

    // 1. Consultar Firestore `/student_lookup/${cleanInput}`
    if (isFirebaseConfigured && db) {
      try {
        const lookupSnap = await getDoc(doc(db, 'student_lookup', cleanInput));
        if (lookupSnap.exists()) {
          const lookupData = lookupSnap.data();
          foundTeacherId = lookupData.teacherId;

          // Obtener los datos completos del aula del docente
          const classroomSnap = await getDoc(doc(db, 'classrooms', foundTeacherId));
          if (classroomSnap.exists()) {
            const clData = classroomSnap.data();
            const stuList = clData.students || [];
            foundStudent = stuList.find(
              (s: any) =>
                s.id === lookupData.studentId ||
                (s.curp && s.curp.toUpperCase() === cleanInput) ||
                (s.matricula && s.matricula.toUpperCase() === cleanInput)
            );

            // Cachear aula en localStorage para navegación offline rápida del tutor
            localStorage.setItem(`lumni_acc_${foundTeacherId}_students`, JSON.stringify(stuList));
            if (clData.subjects) localStorage.setItem(`lumni_acc_${foundTeacherId}_subjects`, JSON.stringify(clData.subjects));
            if (clData.notices) localStorage.setItem(`lumni_acc_${foundTeacherId}_notices`, JSON.stringify(clData.notices));
            if (clData.threads) localStorage.setItem(`lumni_acc_${foundTeacherId}_threads`, JSON.stringify(clData.threads));
            if (clData.projects) localStorage.setItem(`lumni_acc_${foundTeacherId}_projects`, JSON.stringify(clData.projects));
            if (clData.tasks) localStorage.setItem(`lumni_acc_${foundTeacherId}_tasks`, JSON.stringify(clData.tasks));
            if (clData.calendarEvents) localStorage.setItem(`lumni_acc_${foundTeacherId}_calendar`, JSON.stringify(clData.calendarEvents));
            if (clData.incidentReports) localStorage.setItem(`lumni_acc_${foundTeacherId}_incidents`, JSON.stringify(clData.incidentReports));
            if (clData.schoolInfo) localStorage.setItem(`lumni_acc_${foundTeacherId}_school`, JSON.stringify(clData.schoolInfo));
          }
        }
      } catch (err) {
        console.warn('Firestore student lookup error:', err);
      }
    }

    // 2. Si no se encontró en Firestore, buscar a través de las particiones locales
    if (!foundStudent) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lumni_acc_') && key.endsWith('_students')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const match = parsed.find(
                  (s: any) =>
                    (s.curp && s.curp.toUpperCase() === cleanInput) ||
                    (s.matricula && s.matricula.toUpperCase() === cleanInput) ||
                    (s.id && s.id.toUpperCase() === cleanInput)
                );
                if (match) {
                  foundStudent = match;
                  foundTeacherId = key.replace('lumni_acc_', '').replace('_students', '');
                  break;
                }
              }
            }
          } catch {}
        }
      }
    }

    // 3. Fallback a alumnos demo
    if (!foundStudent) {
      const demoMatch = mockStudents.find(
        (s: any) =>
          (s.curp && s.curp.toUpperCase() === cleanInput) ||
          (s.matricula && s.matricula.toUpperCase() === cleanInput) ||
          (s.id && s.id.toUpperCase() === cleanInput)
      );
      if (demoMatch) {
        foundStudent = demoMatch;
        foundTeacherId = 'demo';
      }
    }

    if (!foundStudent) {
      setIsLoading(false);
      return {
        success: false,
        error: `No se encontró ningún estudiante con la clave o CURP "${cleanInput}". Verifica que esté dado de alta por su docente.`,
      };
    }

    const parentProfile: UserProfile = {
      id: `parent_${foundStudent.id}`,
      nombre: foundStudent.tutorNombre || `Tutor de ${foundStudent.nombre}`,
      email: foundStudent.tutorEmail || `${foundStudent.curp?.toLowerCase() || 'tutor'}@correo.com`,
      rol: 'parent',
      colegio: 'Colegio Lumni',
      ciclo: '2026-2027',
      studentId: foundStudent.id,
    };

    setRole('parent');
    setCurrentUser(parentProfile);
    setIsAuthenticated(true);
    localStorage.setItem('lumni_is_authenticated', 'true');
    localStorage.setItem('lumni_active_role', 'parent');
    localStorage.setItem('lumni_user_parent', JSON.stringify(parentProfile));
    localStorage.setItem('lumni_parent_scope_id', foundTeacherId);
    localStorage.setItem('lumni_parent_student_id', foundStudent.id);

    setIsLoading(false);
    return { success: true, student: foundStudent };
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
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('lumni_is_authenticated');
    localStorage.removeItem('lumni_active_role');
    localStorage.removeItem('lumni_parent_scope_id');
    localStorage.removeItem('lumni_parent_student_id');
    localStorage.removeItem('lumni_user_teacher');
    localStorage.removeItem('lumni_user_parent');
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
