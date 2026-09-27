import * as XLSX from 'xlsx';
import { Student, SchoolInfo } from '../types';

/**
 * Normaliza una cadena eliminando acentos, caracteres especiales y espacios sobrantes.
 */
export const cleanText = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
};

/**
 * Obtiene la primera vocal interna de una palabra (ignorando la letra inicial).
 */
const getFirstInternalVowel = (str: string): string => {
  const slice = str.slice(1);
  const match = slice.match(/[AEIOU]/);
  return match ? match[0] : 'X';
};

/**
 * Obtiene la primera consonante interna de una palabra (ignorando la letra inicial).
 */
const getFirstInternalConsonant = (str: string): string => {
  const slice = str.slice(1);
  const match = slice.match(/[BCDFGHJKLMNPQRSTVWXYZ]/);
  return match ? match[0] : 'X';
};

export interface CurpCalculationResult {
  base11: string;
  fullCurp: string;
}

/**
 * Calcula los primeros 11 caracteres oficiales de la CURP según lineamientos de RENAPO:
 * 1. 1ra letra del primer apellido
 * 2. 1ra vocal interna del primer apellido
 * 3. 1ra letra del segundo apellido (o 'X' si no existe)
 * 4. 1ra letra del nombre (si es compuesto y empieza por JOSE o MARIA, toma el segundo)
 * 5-10. Fecha de nacimiento AAMMDD
 * 11. Género ('H' para hombre, 'M' para mujer)
 * + 7 caracteres oficiales (Estado + 3 consonantes internas + homoclave) para completar los 18 caracteres.
 */
export const calculateCurp = (
  nombre: string,
  primerApellido: string,
  segundoApellido: string = '',
  fechaNacimiento: string = '2014-05-18',
  genero: 'M' | 'F' | 'Otro' = 'M',
  estado: string = 'DF'
): CurpCalculationResult => {
  const nomClean = cleanText(nombre);
  const ap1Clean = cleanText(primerApellido) || 'X';
  const ap2Clean = cleanText(segundoApellido) || 'X';

  // 1. Letras iniciales de los apellidos
  const c1 = ap1Clean.charAt(0) || 'X';
  const c2 = getFirstInternalVowel(ap1Clean);
  const c3 = ap2Clean ? ap2Clean.charAt(0) : 'X';

  // 2. Nombre: si es José o María, tomar segundo nombre si está disponible
  const names = nomClean.split(/\s+/).filter(Boolean);
  let mainName = names[0] || 'X';
  if (
    (mainName === 'JOSE' || mainName === 'MARIA' || mainName === 'MA' || mainName === 'MA.') &&
    names[1]
  ) {
    mainName = names[1];
  }
  const c4 = mainName.charAt(0) || 'X';

  // 3. Fecha de nacimiento en formato AAMMDD
  let datePart = '140101';
  if (fechaNacimiento) {
    const digitsOnly = fechaNacimiento.replace(/\D/g, '');
    if (digitsOnly.length === 8) {
      // YYYYMMDD -> YYMMDD
      datePart = digitsOnly.substring(2, 8);
    } else if (digitsOnly.length === 6) {
      datePart = digitsOnly;
    }
  }

  // 4. Género: H para Hombre (Masculino), M para Mujer (Femenino)
  const genderChar = genero === 'F' ? 'M' : 'H';

  // Base exacta de 11 caracteres solicitada
  const base11 = `${c1}${c2}${c3}${c4}${datePart}${genderChar}`;

  // Consonantes internas para completar los 18 caracteres de la CURP oficial
  const con1 = getFirstInternalConsonant(ap1Clean);
  const con2 = ap2Clean ? getFirstInternalConsonant(ap2Clean) : 'X';
  const con3 = getFirstInternalConsonant(mainName);

  // Entidad federativa oficial (2 caracteres)
  const stateCode = (estado || 'DF').substring(0, 2).toUpperCase();

  // Homoclave secuencial / diferenciadora
  const fullCurp = `${base11}${stateCode}${con1}${con2}${con3}01`;

  return { base11, fullCurp };
};

/**
 * Genera la siguiente Matrícula Escolar de Lumni (ej. LUM-2026-001)
 * evitando colisiones con matrículas ya existentes en la plataforma.
 */
export const generateNextMatricula = (
  existingStudents: Student[],
  cycle: string = '2026',
  offset: number = 0
): string => {
  const yearMatch = cycle.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '2026';
  const prefix = `LUM-${year}-`;

  // Encontrar el número más alto existente para este ciclo
  let maxSeq = 0;
  existingStudents.forEach((st) => {
    if (st.matricula && st.matricula.startsWith(prefix)) {
      const numPart = parseInt(st.matricula.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  const nextNumber = maxSeq + 1 + offset;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Descarga la plantilla oficial en Excel (.xlsx) con los campos requeridos
 * y 3 filas de ejemplo para que el docente solo vacíe sus alumnos.
 */
export const downloadStudentExcelTemplate = (schoolInfo?: SchoolInfo) => {
  const currentCiclo = schoolInfo?.ciclo || '2026-2027';

  const templateRows = [
    {
      'Nombre(s)': 'Juan Carlos',
      'Primer Apellido': 'Pérez',
      'Segundo Apellido': 'González',
      'Fecha Nacimiento (AAAA-MM-DD)': '2014-05-18',
      'Género (M/F)': 'M',
      Grado: '3°',
      Grupo: 'B',
      Turno: 'Matutino',
      'Nombre Tutor': 'María González López',
      'Teléfono Tutor (WhatsApp)': '5512345678',
      'Parentesco Tutor': 'Madre',
      'CURP (Opcional)': '',
      'Matrícula (Opcional)': '',
    },
    {
      'Nombre(s)': 'Sofía Valentina',
      'Primer Apellido': 'López',
      'Segundo Apellido': 'Martínez',
      'Fecha Nacimiento (AAAA-MM-DD)': '2014-08-22',
      'Género (M/F)': 'F',
      Grado: '3°',
      Grupo: 'B',
      Turno: 'Matutino',
      'Nombre Tutor': 'Roberto López Torres',
      'Teléfono Tutor (WhatsApp)': '5598765432',
      'Parentesco Tutor': 'Padre',
      'CURP (Opcional)': '',
      'Matrícula (Opcional)': '',
    },
    {
      'Nombre(s)': 'Mateo',
      'Primer Apellido': 'Hernández',
      'Segundo Apellido': 'Ruiz',
      'Fecha Nacimiento (AAAA-MM-DD)': '2014-11-03',
      'Género (M/F)': 'M',
      Grado: '3°',
      Grupo: 'B',
      Turno: 'Matutino',
      'Nombre Tutor': 'Carmen Ruiz Nava',
      'Teléfono Tutor (WhatsApp)': '5543218765',
      'Parentesco Tutor': 'Madre',
      'CURP (Opcional)': '',
      'Matrícula (Opcional)': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);

  // Configurar anchos de columna recomendados para mejor legibilidad
  ws['!cols'] = [
    { wch: 18 }, // Nombre(s)
    { wch: 16 }, // Primer Apellido
    { wch: 16 }, // Segundo Apellido
    { wch: 28 }, // Fecha Nacimiento
    { wch: 14 }, // Género
    { wch: 10 }, // Grado
    { wch: 10 }, // Grupo
    { wch: 12 }, // Turno
    { wch: 26 }, // Nombre Tutor
    { wch: 25 }, // Teléfono Tutor
    { wch: 18 }, // Parentesco Tutor
    { wch: 22 }, // CURP
    { wch: 22 }, // Matrícula
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Alumnos');

  const fileName = `Plantilla_Registro_Alumnos_LUMNI_${currentCiclo.replace('-', '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export interface ParsedStudentRow {
  index: number;
  nombre: string;
  apellidos: string;
  primerApellido: string;
  segundoApellido: string;
  curp: string;
  curpCalculada11: string;
  isCurpAutogenerated: boolean;
  matricula: string;
  isMatriculaAutogenerated: boolean;
  fechaNacimiento: string;
  genero: 'M' | 'F' | 'Otro';
  grado: string;
  grupo: string;
  turno: 'Matutino' | 'Vespertino';
  tutorNombre: string;
  tutorTelefono: string;
  tutorParentesco: string;
  fotoUrl?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Analiza un archivo Excel o CSV subido por el docente y transforma cada fila
 * en un alumno válido calculando la CURP (11 caracteres) y la Matrícula si no vienen.
 */
export const parseStudentExcelFile = async (
  file: File,
  existingStudents: Student[],
  defaultGrado: string = '3°',
  defaultGrupo: string = 'B',
  defaultTurno: 'Matutino' | 'Vespertino' = 'Matutino',
  cycleYear: string = '2026'
): Promise<{
  students: ParsedStudentRow[];
  validCount: number;
  invalidCount: number;
  errors: string[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          resolve({ students: [], validCount: 0, invalidCount: 0, errors: ['El archivo no contiene hojas válidas.'] });
          return;
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (rawRows.length === 0) {
          resolve({ students: [], validCount: 0, invalidCount: 0, errors: ['La hoja de cálculo está vacía.'] });
          return;
        }

        const parsedList: ParsedStudentRow[] = [];
        const errors: string[] = [];
        let autoGeneratedCount = 0;

        rawRows.forEach((row, i) => {
          // Normalizar nombres de columnas ignorando mayúsculas, espacios y acentos
          const getVal = (keys: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanK = cleanText(key);
              for (const search of keys) {
                if (cleanK.includes(cleanText(search))) {
                  const val = row[key];
                  if (val instanceof Date) {
                    return val.toISOString().split('T')[0];
                  }
                  return String(val).trim();
                }
              }
            }
            return '';
          };

          const nombreRaw = getVal(['NOMBRE(S)', 'NOMBRES', 'NOMBRE']);
          let ap1Raw = getVal(['PRIMER APELLIDO', 'APELLIDO PATERNO', 'PATERNO']);
          let ap2Raw = getVal(['SEGUNDO APELLIDO', 'APELLIDO MATERNO', 'MATERNO']);
          const apellidosCompuesto = getVal(['APELLIDOS', 'APELLIDO']);

          // Si solo viene la columna "Apellidos", dividir en paterno y materno
          if (!ap1Raw && apellidosCompuesto) {
            const parts = apellidosCompuesto.split(' ').filter(Boolean);
            ap1Raw = parts[0] || '';
            ap2Raw = parts.slice(1).join(' ');
          }

          const fullApellidos = [ap1Raw, ap2Raw].filter(Boolean).join(' ') || apellidosCompuesto;

          if (!nombreRaw && !fullApellidos) {
            // Fila completamente vacía o de instrucciones en blanco
            return;
          }

          // Fecha de nacimiento
          let fechaNacRaw = getVal(['FECHA NACIMIENTO', 'FECHA DE NACIMIENTO', 'NACIMIENTO', 'FECHA']);
          if (!fechaNacRaw || fechaNacRaw.length < 8) {
            fechaNacRaw = '2014-05-18';
          } else if (fechaNacRaw.includes('/')) {
            // Formato DD/MM/AAAA o MM/DD/AAAA
            const parts = fechaNacRaw.split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                fechaNacRaw = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }

          // Género
          const genVal = cleanText(getVal(['GENERO', 'SEXO'])).charAt(0);
          const genero: 'M' | 'F' | 'Otro' = genVal === 'F' || genVal === 'M' && genVal === 'M' ? (genVal === 'F' ? 'F' : 'M') : (genVal === 'F' ? 'F' : 'M');

          // Grado, Grupo, Turno
          const grado = getVal(['GRADO']) || defaultGrado;
          const grupo = getVal(['GRUPO']) || defaultGrupo;
          const turnoRaw = getVal(['TURNO']).toLowerCase();
          const turno: 'Matutino' | 'Vespertino' = turnoRaw.includes('vesp') ? 'Vespertino' : defaultTurno;

          // Datos del Tutor
          const tutorNombre = getVal(['NOMBRE TUTOR', 'TUTOR', 'PADRE', 'MADRE']) || `Tutor de ${nombreRaw}`;
          const tutorTelefono = getVal(['TELEFONO TUTOR', 'TELEFONO', 'CELULAR', 'WHATSAPP']) || '5500000000';
          const tutorParentesco = getVal(['PARENTESCO TUTOR', 'PARENTESCO']) || 'Tutor';

          // CURP: Si viene completa, usarla; si está vacía, calcular automáticamente
          const curpInput = cleanText(getVal(['CURP']));
          let finalCurp = curpInput;
          let isCurpAutogenerated = false;
          let curpCalculada11 = '';

          const curpResult = calculateCurp(nombreRaw, ap1Raw, ap2Raw, fechaNacRaw, genero);
          curpCalculada11 = curpResult.base11;

          if (!curpInput || curpInput.length < 11) {
            finalCurp = curpResult.fullCurp;
            isCurpAutogenerated = true;
          } else if (curpInput.length === 11) {
            finalCurp = `${curpInput}DFRTA01`;
            isCurpAutogenerated = true;
          }

          // Matrícula: Si viene dada, usarla; si está vacía, calcular correlativa de Lumni
          const matriculaInput = cleanText(getVal(['MATRICULA', 'MATRICULA ESCOLAR']));
          let finalMatricula = matriculaInput;
          let isMatriculaAutogenerated = false;

          if (!matriculaInput) {
            finalMatricula = generateNextMatricula(existingStudents, cycleYear, autoGeneratedCount);
            autoGeneratedCount++;
            isMatriculaAutogenerated = true;
          }

          const isValid = Boolean(nombreRaw.trim() && fullApellidos.trim());
          if (!isValid) {
            errors.push(`Fila ${i + 2}: El alumno debe contar con nombre y apellidos.`);
          }

          parsedList.push({
            index: i + 1,
            nombre: nombreRaw,
            apellidos: fullApellidos,
            primerApellido: ap1Raw,
            segundoApellido: ap2Raw,
            curp: finalCurp,
            curpCalculada11,
            isCurpAutogenerated,
            matricula: finalMatricula,
            isMatriculaAutogenerated,
            fechaNacimiento: fechaNacRaw,
            genero,
            grado,
            grupo,
            turno,
            tutorNombre,
            tutorTelefono,
            tutorParentesco,
            isValid,
            error: !isValid ? 'Falta nombre o apellidos' : undefined,
          });
        });

        const validCount = parsedList.filter((s) => s.isValid).length;
        const invalidCount = parsedList.length - validCount;

        resolve({
          students: parsedList,
          validCount,
          invalidCount,
          errors,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Error al procesar el archivo Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo en disco.'));
    reader.readAsBinaryString(file);
  });
};
