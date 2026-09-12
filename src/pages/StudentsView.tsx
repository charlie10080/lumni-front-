import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { StudentCredentialModal } from '../components/students/StudentCredentialModal';
import { Student } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  QrCode,
  Edit2,
  Trash2,
  CheckCircle,
  Phone,
  Sparkles,
} from 'lucide-react';

export const StudentsView: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, schoolInfo } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrado, setFilterGrado] = useState('todos');
  const [filterGrupo, setFilterGrupo] = useState('todos');
  const [filterTurno, setFilterTurno] = useState('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [credentialStudent, setCredentialStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    curp: '',
    matricula: '',
    fechaNacimiento: '2014-05-18',
    genero: 'M' as 'M' | 'F' | 'Otro',
    grado: '3°',
    grupo: 'B',
    turno: 'Matutino' as 'Matutino' | 'Vespertino',
    tutorNombre: '',
    tutorTelefono: '',
    tutorEmail: '',
    tutorParentesco: 'Madre',
    activo: true,
  });

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      student.nombre.toLowerCase().includes(term) ||
      student.apellidos.toLowerCase().includes(term) ||
      student.matricula.toLowerCase().includes(term) ||
      student.curp.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (filterGrado !== 'todos' && student.grado !== filterGrado) return false;
    if (filterGrupo !== 'todos' && student.grupo !== filterGrupo) return false;
    if (filterTurno !== 'todos' && student.turno !== filterTurno) return false;

    return true;
  });

  const handleCurpChange = (rawCurp: string) => {
    const curp = rawCurp.toUpperCase();
    let updatedGenero = formData.genero;

    if (curp.length >= 11) {
      const gChar = curp.charAt(10);
      if (gChar === 'H') updatedGenero = 'M';
      else if (gChar === 'M') updatedGenero = 'F';
    }

    setFormData((prev) => ({
      ...prev,
      curp,
      genero: updatedGenero,
    }));
  };

  // CURP 11-character auto-suggester
  const autoSuggestCurp = () => {
    const nom = formData.nombre.trim().toUpperCase();
    const aps = formData.apellidos.trim().toUpperCase().split(' ');
    const ap1 = aps[0] || 'X';
    const ap2 = aps[1] || 'X';

    // 1. First letter and first internal vowel of primer apellido
    const c1 = ap1.charAt(0) || 'X';
    const vowels = ap1.slice(1).match(/[AEIOU]/);
    const c2 = vowels ? vowels[0] : 'X';

    // 2. First letter of segundo apellido
    const c3 = ap2.charAt(0) || 'X';

    // 3. First letter of name (if composite and starts with JOSE or MARIA, take 2nd name if available)
    const names = nom.split(' ');
    let firstName = names[0] || 'X';
    if ((firstName === 'JOSE' || firstName === 'MARIA' || firstName === 'MA' || firstName === 'MA.') && names[1]) {
      firstName = names[1];
    }
    const c4 = firstName.charAt(0) || 'X';

    // 4. Date YYMMDD
    let datePart = '140101';
    if (formData.fechaNacimiento) {
      const cleanDate = formData.fechaNacimiento.replace(/-/g, '');
      if (cleanDate.length >= 8) {
        datePart = cleanDate.substring(2, 8); // YYMMDD
      }
    }

    // 5. Gender char: H for Male, M for Female
    const genderChar = formData.genero === 'F' ? 'M' : 'H';

    const base11 = `${c1}${c2}${c3}${c4}${datePart}${genderChar}`;
    // Preserve remaining 7 characters if user already typed them, or use generic homoclave suffix
    const existingSuffix = formData.curp.length >= 18 ? formData.curp.substring(11) : 'DFRTA03';
    const suggestedFull = `${base11}${existingSuffix}`;

    setFormData((prev) => ({
      ...prev,
      curp: suggestedFull,
    }));
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    const nextNum = String(students.length + 1).padStart(3, '0');
    setFormData({
      nombre: '',
      apellidos: '',
      curp: '',
      matricula: `LUM-2026-${nextNum}`,
      fechaNacimiento: '2014-05-18',
      genero: 'M',
      grado: '3°',
      grupo: 'B',
      turno: 'Matutino',
      tutorNombre: '',
      tutorTelefono: '',
      tutorEmail: '',
      tutorParentesco: 'Madre',
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nombre: student.nombre,
      apellidos: student.apellidos,
      curp: student.curp,
      matricula: student.matricula,
      fechaNacimiento: student.fechaNacimiento || '2014-05-18',
      genero: student.genero,
      grado: student.grado,
      grupo: student.grupo,
      turno: student.turno,
      tutorNombre: student.tutorNombre,
      tutorTelefono: student.tutorTelefono,
      tutorEmail: student.tutorEmail || '',
      tutorParentesco: student.tutorParentesco || 'Madre',
      activo: student.activo,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateStudent(editingStudent.id, formData);
    } else {
      addStudent(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Padrón Escolar de Alumnos & Credencialización
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Gestión completa de expedientes escolares con CURP oficial, credenciales con código QR y filtros de grupo.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Nuevo Alumno
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="w-full md:w-96">
            <Input
              placeholder="Buscar por nombre, CURP o matrícula..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Grado:</span>
              <select
                value={filterGrado}
                onChange={(e) => setFilterGrado(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="1°">1°</option>
                <option value="2°">2°</option>
                <option value="3°">3°</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span>Grupo:</span>
              <select
                value={filterGrupo}
                onChange={(e) => setFilterGrupo(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span>Turno:</span>
              <select
                value={filterTurno}
                onChange={(e) => setFilterTurno(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
              Total: <strong className="text-slate-900 dark:text-white">{filteredStudents.length}</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Alumno</th>
                <th className="py-3.5 px-4">CURP / Matrícula</th>
                <th className="py-3.5 px-4">Grado & Turno</th>
                <th className="py-3.5 px-4">Tutor Principal</th>
                <th className="py-3.5 px-4 text-center">Credencial QR</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
                      {student.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{student.nombre} {student.apellidos}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle className="w-3 h-3" /> Activo
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-300 font-semibold">{student.curp}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{student.matricula}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">{student.grado} {student.grupo}</p>
                    <p className="text-slate-500 dark:text-slate-400">{student.turno}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">{student.tutorNombre}</p>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {student.tutorTelefono}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      onClick={() => setCredentialStudent(student)}
                    >
                      Credencial
                    </Button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Editar alumno"
                        onClick={() => handleOpenEdit(student)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        title="Eliminar alumno"
                        onClick={() => {
                          if (confirm(`¿Seguro que deseas dar de baja a ${student.nombre}?`)) {
                            deleteStudent(student.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Formulario Alumno */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Editar Expediente de Alumno' : 'Registro de Nuevo Alumno'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre(s)"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <Input
              label="Apellidos"
              required
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  CURP (18 Caracteres) *
                </label>
                <button
                  type="button"
                  onClick={autoSuggestCurp}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition"
                  title="Calcular los primeros 11 caracteres oficiales a partir del nombre, apellidos, fecha de nacimiento y género"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Sugerir CURP
                </button>
              </div>
              <input
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                maxLength={18}
                placeholder="AAAA000000HXXXXX00"
                value={formData.curp}
                onChange={(e) => handleCurpChange(e.target.value)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Calcula automáticamente 11 caracteres (Nombre + Fecha + Sexo).
              </span>
            </div>

            <Input
              label="Matrícula Escolar"
              required
              value={formData.matricula}
              onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Género
              </label>
              <select
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value as any })}
              >
                <option value="M">Masculino (Hombre)</option>
                <option value="F">Femenino (Mujer)</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Grado & Grupo
              </label>
              <div className="flex gap-2">
                <input
                  className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.grado}
                  onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                />
                <input
                  className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.grupo}
                  onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Turno
              </label>
              <select
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.turno}
                onChange={(e) => setFormData({ ...formData, turno: e.target.value as any })}
              >
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
              Datos del Tutor o Padre de Familia
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre del Tutor"
                required
                value={formData.tutorNombre}
                onChange={(e) => setFormData({ ...formData, tutorNombre: e.target.value })}
              />
              <Input
                label="Teléfono de Contacto"
                required
                value={formData.tutorTelefono}
                onChange={(e) => setFormData({ ...formData, tutorTelefono: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingStudent ? 'Guardar Cambios' : 'Registrar Alumno'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Student Credential Modal */}
      <StudentCredentialModal
        isOpen={Boolean(credentialStudent)}
        onClose={() => setCredentialStudent(null)}
        student={credentialStudent}
        schoolInfo={schoolInfo}
      />
    </div>
  );
};
