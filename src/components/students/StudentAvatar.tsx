import React from 'react';
import type { Student } from '../../types';

const CHARACTERS: Record<Student['genero'], string> = {
  M: '👦',
  F: '👧',
  Otro: '🧒',
};

interface StudentAvatarProps {
  genero?: Student['genero'];
  /** Clases de tamaño, forma y texto (ej. "w-11 h-11 rounded-2xl text-2xl") */
  className?: string;
}

/** Personaje del alumno según su género; sustituye a la fotografía. */
export const StudentAvatar: React.FC<StudentAvatarProps> = ({ genero = 'Otro', className = '' }) => (
  <div
    className={`bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shrink-0 ${className}`}
    aria-hidden="true"
  >
    {CHARACTERS[genero]}
  </div>
);
