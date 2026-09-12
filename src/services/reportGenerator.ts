import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Student, Subject, SchoolInfo } from '../types';

// ==========================================
// 1. GENERADOR DE BOLETA ESCOLAR EN PDF
// ==========================================
export const generateOfficialBoletaPDF = (
  student: Student,
  subjects: Subject[],
  schoolInfo: SchoolInfo,
  teacherName: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Cabecera Institucional ---
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(schoolInfo.nombre.toUpperCase(), pageWidth / 2, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `CLAVE C.C.T: ${schoolInfo.cct}  |  CICLO ESCOLAR: ${schoolInfo.ciclo}`,
    pageWidth / 2,
    18,
    { align: 'center' }
  );
  doc.text(
    `${schoolInfo.direccion}  -  Teléfono: ${schoolInfo.telefono}`,
    pageWidth / 2,
    23,
    { align: 'center' }
  );

  // Subtítulo
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BOLETA DE EVALUACIÓN TRIMESTRAL', pageWidth / 2, 36, { align: 'center' });

  // --- Ficha del Alumno ---
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(14, 40, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('NOMBRE DEL ALUMNO(A):', 18, 46);
  doc.text('CURP:', 18, 54);
  doc.text('GRADO Y GRUPO:', 18, 62);

  doc.text('MATRÍCULA ESCOLAR:', 110, 46);
  doc.text('TURNO:', 110, 54);
  doc.text('FECHA DE EXPEDICIÓN:', 110, 62);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${student.nombre} ${student.apellidos}`, 62, 46);
  doc.text(student.curp, 62, 54);
  doc.text(`${student.grado} Grado  -  Grupo "${student.grupo}"`, 62, 62);

  doc.text(student.matricula, 150, 46);
  doc.text(student.turno, 150, 54);
  doc.text(new Date().toLocaleDateString('es-MX'), 150, 62);

  // --- Tabla de Calificaciones ---
  const tableRows: any[] = [];
  let sumFinalGrades = 0;
  let countFinalGrades = 0;

  subjects.forEach((sub) => {
    const g1 = student.calificacionesTrimestres[1]?.[sub.nombre] ?? '-';
    const g2 = student.calificacionesTrimestres[2]?.[sub.nombre] ?? '-';
    const g3 = student.calificacionesTrimestres[3]?.[sub.nombre] ?? '-';

    const valid = [g1, g2, g3].filter((g): g is number => typeof g === 'number');
    const finalAvg = valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : '-';

    if (finalAvg !== '-') {
      sumFinalGrades += parseFloat(finalAvg);
      countFinalGrades++;
    }

    tableRows.push([
      sub.nombre,
      sub.clave || 'STD',
      g1 !== '-' ? (typeof g1 === 'number' ? Math.round(g1) : g1) : '-',
      g2 !== '-' ? (typeof g2 === 'number' ? Math.round(g2) : g2) : '-',
      g3 !== '-' ? (typeof g3 === 'number' ? Math.round(g3) : g3) : '-',
      finalAvg,
    ]);
  });

  const overallAverage = countFinalGrades > 0 ? (sumFinalGrades / countFinalGrades).toFixed(1) : '-';

  autoTable(doc, {
    startY: 70,
    margin: { left: 14, right: 14 },
    head: [['ASIGNATURA', 'CLAVE', '1ER TRIM.', '2DO TRIM.', '3ER TRIM.', 'PROM. FINAL']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      halign: 'center',
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'center', cellWidth: 25 },
    },
    foot: [['PROMEDIO GENERAL DEL CICLO ESCOLAR', '', '', '', '', overallAverage]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
    },
  });

  // --- Resumen de Asistencia ---
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('RESUMEN DE ASISTENCIA Y PUNTUALIDAD:', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `• Días Presente: ${student.asistenciasTotales.presentes}       • Retardos: ${student.asistenciasTotales.retardos}       • Faltas Registradas: ${student.asistenciasTotales.faltas}       • Justificadas: ${student.asistenciasTotales.justificadas || 0}`,
    18,
    finalY + 13
  );

  // --- Firmas ---
  const signY = finalY + 38;

  // Firma Docente
  doc.setDrawColor(100, 116, 139);
  doc.line(25, signY, 85, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(teacherName, 55, signY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Profesor(a) Titular de Grupo', 55, signY + 9, { align: 'center' });

  // Firma Dirección
  doc.line(pageWidth - 85, signY, pageWidth - 25, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolInfo.director, pageWidth - 55, signY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Dirección del Plantel Escolar', pageWidth - 55, signY + 9, { align: 'center' });

  // Sello de Seguridad Lumni y Aviso de No Oficialidad
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'DOCUMENTO DE CONTROL INTERNO ESCOLAR PARA SEGUIMIENTO INFORMATIVO. NO CONSTITUYE BOLETA OFICIAL GUBERNAMENTAL (SEP).',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 11,
    { align: 'center' }
  );
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Expedido por Plataforma Lumni v2.0 - Folio: LUM-${student.id.toUpperCase()}-${Date.now().toString().slice(-6)}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 7,
    { align: 'center' }
  );

  // Descargar Archivo
  const cleanName = `${student.apellidos}_${student.nombre}`.replace(/\s+/g, '_');
  doc.save(`Boleta_${student.matricula}_${cleanName}.pdf`);
};

// ==========================================
// 2. EXPORTADOR DE CALIFICACIONES A EXCEL (.xlsx)
// ==========================================
export const exportGradesToExcel = (
  students: Student[],
  subjects: Subject[],
  schoolInfo: SchoolInfo,
  trimester: 1 | 2 | 3 | 'anual'
) => {
  const data: any[] = [];

  students.forEach((s) => {
    const row: any = {
      Matrícula: s.matricula,
      Alumno: `${s.apellidos}, ${s.nombre}`,
      CURP: s.curp,
      Grado: s.grado,
      Grupo: s.grupo,
      Turno: s.turno,
    };

    let totalScore = 0;
    let countScore = 0;

    subjects.forEach((sub) => {
      let gradeVal: number | null = null;
      if (trimester === 'anual') {
        const g1 = s.calificacionesTrimestres[1]?.[sub.nombre];
        const g2 = s.calificacionesTrimestres[2]?.[sub.nombre];
        const g3 = s.calificacionesTrimestres[3]?.[sub.nombre];
        const valid = [g1, g2, g3].filter((g): g is number => typeof g === 'number');
        gradeVal = valid.length ? parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)) : null;
      } else {
        const raw = s.calificacionesTrimestres[trimester]?.[sub.nombre];
        gradeVal = raw !== undefined && raw !== null ? Math.round(raw) : null;
      }

      row[sub.nombre] = gradeVal !== null ? gradeVal : '-';
      if (gradeVal !== null) {
        totalScore += gradeVal;
        countScore++;
      }
    });

    row['Promedio Final'] = countScore > 0 ? parseFloat((totalScore / countScore).toFixed(1)) : '-';
    data.push(row);
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');

  const fileName = `Concentrado_Calificaciones_T${trimester}_${schoolInfo.ciclo.replace('-', '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ==========================================
// 3. EXPORTADOR DE PADRÓN DE ALUMNOS A EXCEL (.xlsx)
// ==========================================
export const exportStudentsToExcel = (students: Student[], schoolInfo: SchoolInfo) => {
  const data = students.map((s, idx) => ({
    No: idx + 1,
    Matrícula: s.matricula,
    'Nombre(s)': s.nombre,
    Apellidos: s.apellidos,
    CURP: s.curp,
    Género: s.genero,
    Grado: s.grado,
    Grupo: s.grupo,
    Turno: s.turno,
    'Tutor Principal': s.tutorNombre,
    'Teléfono Tutor': s.tutorTelefono,
    'Email Tutor': s.tutorEmail || '-',
    'Parentesco': s.tutorParentesco || 'Tutor',
    'Asistencias Totales': s.asistenciasTotales.presentes,
    'Retardos Totales': s.asistenciasTotales.retardos,
    'Faltas Totales': s.asistenciasTotales.faltas,
    Estatus: s.activo ? 'ACTIVO' : 'INACTIVO',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Padron_Escolar');

  const fileName = `Padron_Alumnos_${schoolInfo.ciclo.replace('-', '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ==========================================
// 4. EXPORTADOR DE ASISTENCIAS A EXCEL (.xlsx)
// ==========================================
export const exportAttendanceToExcel = (students: Student[], schoolInfo: SchoolInfo) => {
  const data = students.map((s, idx) => ({
    No: idx + 1,
    Matrícula: s.matricula,
    Alumno: `${s.apellidos}, ${s.nombre}`,
    Grado: s.grado,
    Grupo: s.grupo,
    'Días Presente': s.asistenciasTotales.presentes,
    'Total Retardos': s.asistenciasTotales.retardos,
    'Total Faltas': s.asistenciasTotales.faltas,
    'Justificadas': s.asistenciasTotales.justificadas || 0,
    '% Asistencia':
      s.asistenciasTotales.presentes + s.asistenciasTotales.faltas > 0
        ? `${Math.round(
            (s.asistenciasTotales.presentes /
              (s.asistenciasTotales.presentes + s.asistenciasTotales.faltas)) *
              100
          )}%`
        : '100%',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

  const fileName = `Concentrado_Asistencias_${schoolInfo.ciclo.replace('-', '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ==========================================
// 5. DESCARGAR PLANTILLA EXCEL PARA CALIFICACIONES
// ==========================================
export const downloadGradesExcelTemplate = (
  students: Student[],
  subjects: Subject[],
  trimester: 1 | 2 | 3 = 1,
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const data = students.map((s) => {
    const row: Record<string, any> = {
      Matrícula: s.matricula,
      Alumno: `${s.apellidos} ${s.nombre}`,
      CURP: s.curp,
    };

    subjects.forEach((sub) => {
      const currentGrade = s.calificacionesTrimestres[trimester]?.[sub.nombre];
      row[sub.nombre] = typeof currentGrade === 'number' ? Math.round(currentGrade) : '';
    });

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Notas_Trimestre_${trimester}`);

  const fileName = `Plantilla_Calificaciones_T${trimester}.${format}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

