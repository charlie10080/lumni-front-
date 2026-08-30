const API_BASE_URL = 'http://localhost:3000/api';

    // ==========================================================
    // 1. ESTADO GLOBAL & PERSISTENCIA
    // ==========================================================
    let isCameraActive = false;
    let html5QrScannerInstance = null;
    let isParentCameraActive = false;
    let parentHtml5QrScannerInstance = null;
    let currentActiveModalUuid = '';
    let selectedThreadId = 1;
    let currentParentStudent = null;

    // Estado global de ordenamiento
    let alumnosSortCol = '';
    let alumnosSortDir = 'asc';
    let gradesSortCol = '';
    let gradesSortDir = 'asc';

    // Datos del Maestro & Suscripción Docente ($250 MXN inicial / $50 MXN al mes)
    const SUSCRIPCION_INICIAL = 250;
    const SUSCRIPCION_MENSUAL = 50;

    let maestroState = JSON.parse(localStorage.getItem('lumni_maestro')) || {
      nombre: 'Prof. Carlos Mendoza Morales',
      correo: 'carlos.mendoza@colegio.edu.mx',
      grupo: '3er Grado Grupo B',
      colegio: 'Lumni',
      ciclo: '2026-2027',
      maxAlumnos: 50,
      suscripcion: {
        estado: 'activa',
        plan: 'Docente Pro',
        pagoInicial: 250,
        mensualidad: 50,
        fechaInicio: '2026-08-01',
        proximoPago: '01 de Octubre 2026',
        ultimoPagoMonto: 250,
        mesesActivo: 1
      }
    };
    if (!maestroState.suscripcion) {
      maestroState.suscripcion = {
        estado: 'activa',
        plan: 'Docente Pro',
        pagoInicial: 250,
        mensualidad: 50,
        fechaInicio: '2026-08-01',
        proximoPago: '01 de Octubre 2026',
        ultimoPagoMonto: 250,
        mesesActivo: 1
      };
    }

    function getMaxAlumnos() {
      return parseInt(maestroState.maxAlumnos, 10) || 50;
    }

    function getActiveAlumnosCount() {
      return alumnosState.length;
    }

    // Plantilla de Materias Dinámicas
    let materiasState = JSON.parse(localStorage.getItem('lumni_materias')) || [
      'Español',
      'Matemáticas',
      'Ciencias Naturales',
      'Historia'
    ];

    // Alumnos Registrados con Registro Completo y CURP (Hasta el Género: 11 caracteres)
    let alumnosState = JSON.parse(localStorage.getItem('lumni_alumnos')) || [];
    // Limpieza de datos heredados o plantillas previas de asistencia
    alumnosState.forEach(a => {
      if (a.asistenciasTotales && a.asistenciasTotales.presentes === 22 && a.asistenciasTotales.retardos === 1) {
        a.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
      }
      if (!a.asistenciasTotales) {
        a.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
      }
    });

    // Proyectos Escolares
    let proyectosState = JSON.parse(localStorage.getItem('lumni_proyectos')) || [];

    // Tareas Escolares
    let tareasState = JSON.parse(localStorage.getItem('lumni_tareas')) || [];

    // Mensajería Asíncrona (Hilos y Mensajes)
    let mensajesState = JSON.parse(localStorage.getItem('lumni_mensajes')) || [];

    // Reportes Individuales
    let reportesState = JSON.parse(localStorage.getItem('lumni_reportes')) || [];

    // Calendario Eventos
    let calendarioEventsState = JSON.parse(localStorage.getItem('lumni_calendario')) || [];

    function saveState() {
      localStorage.setItem('lumni_maestro', JSON.stringify(maestroState));
      localStorage.setItem('lumni_materias', JSON.stringify(materiasState));
      localStorage.setItem('lumni_alumnos', JSON.stringify(alumnosState));
      localStorage.setItem('lumni_proyectos', JSON.stringify(proyectosState));
      localStorage.setItem('lumni_tareas', JSON.stringify(tareasState));
      localStorage.setItem('lumni_mensajes', JSON.stringify(mensajesState));
      localStorage.setItem('lumni_reportes', JSON.stringify(reportesState));
      localStorage.setItem('lumni_anuncios', JSON.stringify(anunciosState));
      localStorage.setItem('lumni_calendario', JSON.stringify(calendarioEventsState));
    }

    // Efectos de sonido sintéticos Web Audio API (100% offline)
    function playScanChime(type = 'success') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.25);
        } else {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (e) {
        console.warn("Audio chime no disponible", e);
      }
    }

    // ==========================================================
    // 2. ENRUTADOR Y CONTROL DE VISTAS (SPA)
    // ==========================================================
    const MAIN_VIEWS = [
      'view-landing',
      'view-auth-maestro',
      'view-auth-padre',
      'view-portal-maestro',
      'view-portal-padres'
    ];

    function showView(targetViewId) {
      MAIN_VIEWS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

      const targetEl = document.getElementById(targetViewId);
      if (targetEl) targetEl.classList.remove('hidden');

      const globalFooter = document.getElementById('global-footer');
      if (globalFooter) {
        if (targetViewId === 'view-portal-maestro') {
          globalFooter.classList.add('hidden');
        } else {
          globalFooter.classList.remove('hidden');
        }
      }

      if (isCameraActive) stopQrCamera();
      if (isParentCameraActive) stopParentQrCamera();

      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.lucide) lucide.createIcons();
    }

    function handleLogout() {
      localStorage.clear();
      alumnosState = [];
      mensajesState = [];
      showToast("Sesión cerrada correctamente", "info");
      window.location.reload();
    }

    async function printStudentReport(studentId) {
      try {
        const id = studentId || currentBoletaStudent?.id || currentBoletaStudent?.uuid;
        if (!id) return showToast("Selecciona un alumno para imprimir", "error");

        const res = await fetch(`${API_BASE_URL}/reportes/alumno/${id}`);
        if (!res.ok) throw new Error('No se pudo obtener el reporte');
        
        const { alumno, calificaciones, estadisticasAsistencia } = await res.json();
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Boleta de Evaluación - ${alumno.nombre_completo || alumno.nombre}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; }
                    .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
                    th { background-color: #f1f5f9; }
                    .stats { background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Boleta de Evaluación Individual</h2>
                    <p>Ciclo Escolar Activo</p>
                </div>
                <div class="info-grid">
                    <div><strong>Alumno:</strong> ${alumno.nombre_completo || alumno.nombre}</div>
                    <div><strong>CURP / ID:</strong> ${alumno.curp || alumno.id}</div>
                    <div><strong>Tutor:</strong> ${alumno.nombre_tutor || alumno.tutor || 'No registrado'}</div>
                    <div><strong>Contacto:</strong> ${alumno.telefono_tutor || alumno.telefono || 'No registrado'}</div>
                </div>
                <h3>Calificaciones por Materia</h3>
                <table>
                    <thead>
                        <tr><th>Materia</th><th>Periodo</th><th>Calificación</th><th>Observaciones</th></tr>
                    </thead>
                    <tbody>
                        ${calificaciones && calificaciones.length ? calificaciones.map(c => `
                            <tr>
                                <td>${c.materia}</td>
                                <td>${c.periodo || '1°'}</td>
                                <td><strong>${c.calificacion}</strong></td>
                                <td>${c.observaciones || '-'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="text-align:center;">Sin calificaciones registradas</td></tr>'}
                    </tbody>
                </table>
                <div class="stats">
                    <h3>Resumen de Asistencia</h3>
                    <p>Asistencias: <strong>${estadisticasAsistencia.asistencias}</strong> | Faltas: <strong>${estadisticasAsistencia.faltas}</strong> | Retardos: <strong>${estadisticasAsistencia.retardos}</strong> | Porcentaje: <strong>${estadisticasAsistencia.porcentaje}%</strong></p>
                </div>
                <script>
                    window.onload = () => { window.print(); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
      } catch (err) {
        console.error('Error al generar boleta:', err);
        showToast('Error al generar la boleta de evaluación.', 'error');
      }
    }

    function printBoleta() {
      if (currentBoletaStudent) {
        printStudentReport(currentBoletaStudent.id || currentBoletaStudent.uuid);
      } else {
        window.print();
      }
    }

    function logout() {
      handleLogout();
    }

    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
      lucide.createIcons();
    }

    // Sidebar Móvil
    function toggleTeacherSidebar() {
      const sidebar = document.getElementById('teacher-sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');

      const isOpen = !sidebar.classList.contains('-translate-x-full');
      if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      } else {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
      }
    }

    function closeMobileSidebarIfOpen() {
      if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('teacher-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      }
    }

    // ==========================================================
    // UTILIDADES ASINCRONAS
    // ==========================================================
    async function withLoading(btn, asyncFn) {
      const originalHtml = btn.innerHTML;
      const originalDisabled = btn.disabled;
      try {
        btn.innerHTML = '<span class="flex items-center justify-center gap-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Cargando...</span>';
        btn.disabled = true;
        if (window.lucide) lucide.createIcons();
        await asyncFn();
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = originalDisabled;
        if (window.lucide) lucide.createIcons();
      }
    }

    // ==========================================================
    // 3. FLUJO MAESTRO: LOGIN/REGISTRO & DASHBOARD
    // ==========================================================
    function toggleTeacherAuthMode(mode) {
      const formLogin = document.getElementById('form-teacher-login');
      const formRegister = document.getElementById('form-teacher-register');
      const btnLogin = document.getElementById('tab-btn-login');
      const btnRegister = document.getElementById('tab-btn-register');

      if (mode === 'login') {
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        btnLogin.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs transition-all cursor-pointer";
        btnRegister.className = "flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all cursor-pointer";
      } else {
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        btnRegister.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs transition-all cursor-pointer";
        btnLogin.className = "flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all cursor-pointer";
      }
      lucide.createIcons();
    }

    function handleTeacherLoginSubmit(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');

      const email = document.getElementById('login_correo')?.value.trim();
      const password = document.getElementById('login_password')?.value.trim();

      if (!email || !password) {
        showToast("Por favor completa email y contraseña", "error");
        return;
      }

      const payload = {
        email: email,
        password: password
      };

      withLoading(btn, async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/maestros/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al iniciar sesión');
          }

          const data = await res.json();
          const maestro = data.maestro || data.datos;

          if (maestro && maestro.id) {
            localStorage.setItem('currentTeacherId', maestro.id);
            maestroState.id = maestro.id;
          }

          if (maestro) {
            maestroState.nombre = maestro.nombre || maestroState.nombre;
            maestroState.correo = maestro.email || maestroState.correo;
            if (maestro.grado && maestro.grupo) {
              maestroState.grado = maestro.grado;
              maestroState.grupo = `${maestro.grado} ${maestro.grupo}`;
            }
          }
          saveState();

          openTeacherDashboard();
          loadTeacherMessages();
          showToast(`¡Bienvenido de nuevo, ${maestroState.nombre}!`, "success");
        } catch (err) {
          showToast(err.message || "Error al iniciar sesión", "error");
        }
      });
    }

    function parseGradoYGrupo(fullString) {
      const str = (fullString || '3er Grado Grupo B').trim();
      let grado = '3er Grado';
      let grupo = 'Grupo B';

      if (str.includes('1er') || str.includes('1°') || str.startsWith('1')) grado = '1er Grado';
      else if (str.includes('2do') || str.includes('2°') || str.startsWith('2')) grado = '2do Grado';
      else if (str.includes('3er') || str.includes('3°') || str.startsWith('3')) grado = '3er Grado';
      else if (str.includes('4to') || str.includes('4°') || str.startsWith('4')) grado = '4to Grado';
      else if (str.includes('5to') || str.includes('5°') || str.startsWith('5')) grado = '5to Grado';
      else if (str.includes('6to') || str.includes('6°') || str.startsWith('6')) grado = '6to Grado';

      if (str.includes('Grupo A') || str.endsWith(' A') || str.endsWith('A')) grupo = 'Grupo A';
      else if (str.includes('Grupo B') || str.endsWith(' B') || str.endsWith('B')) grupo = 'Grupo B';
      else if (str.includes('Grupo C') || str.endsWith(' C') || str.endsWith('C')) grupo = 'Grupo C';
      else if (str.includes('Grupo D') || str.endsWith(' D') || str.endsWith('D')) grupo = 'Grupo D';
      else if (str.includes('Grupo E') || str.endsWith(' E') || str.endsWith('E')) grupo = 'Grupo E';
      else if (str.includes('Grupo F') || str.endsWith(' F') || str.endsWith('F')) grupo = 'Grupo F';

      return { grado, grupo };
    }

    function handleTeacherRegisterSubmit(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');

      const nombre = document.getElementById('reg_nombre')?.value.trim();
      const email = document.getElementById('reg_correo')?.value.trim();
      const password = document.getElementById('reg_password')?.value.trim();
      const gradoSel = document.getElementById('reg_grado_sel');
      const grupoSel = document.getElementById('reg_grupo_sel');
      const grado = gradoSel ? gradoSel.value : '3er Grado';
      const grupo = grupoSel ? grupoSel.value : 'Grupo B';

      if (!nombre || !email || !password) {
        showToast("Por favor completa todos los campos obligatorios", "error");
        return;
      }

      const payload = {
        nombre: nombre,
        email: email,
        password: password,
        grado: grado,
        grupo: grupo
      };

      withLoading(btn, async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/maestros/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al registrar maestro');
          }

          const data = await res.json();
          const maestro = data.maestro || data.datos;

          if (maestro && maestro.id) {
            localStorage.setItem('currentTeacherId', maestro.id);
            maestroState.id = maestro.id;
          }
          maestroState.nombre = maestro?.nombre || nombre;
          maestroState.correo = maestro?.email || email;
          maestroState.grado = maestro?.grado || grado;
          maestroState.grupo = `${grado} ${grupo}`;
          saveState();

          openTeacherDashboard();
          showToast(`¡Registro completado! Bienvenido(a), ${maestroState.nombre}`, "success");
        } catch (err) {
          showToast(err.message || "Error al registrar maestro", "error");
        }
      });
    }

    
    // ==========================================================
    // CARGA DE ALUMNOS DEL MAESTRO DESDE BACKEND
    // ==========================================================
    async function loadTeacherStudents(teacherId) {
      const id = teacherId || localStorage.getItem('currentTeacherId') || maestroState.id;
      if (!id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/alumnos/maestro/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            alumnosState = data.map(a => ({
              id: a.id,
              uuid: a.id || a.uuid || ('alu-' + crypto.randomUUID()),
              id_maestro: a.id_maestro || id,
              nombre: a.nombre_completo || a.nombre || 'Alumno',
              nombre_completo: a.nombre_completo || a.nombre || 'Alumno',
              nombres: a.nombres || (a.nombre_completo ? a.nombre_completo.split(' ')[0] : 'Alumno'),
              primerApellido: a.primer_apellido || '',
              segundoApellido: a.segundo_apellido || '',
              fechaNacimiento: a.fecha_nacimiento || '2017-01-01',
              sexo: a.sexo || 'M',
              curp: a.curp || (a.id ? a.id.substring(0, 11).toUpperCase() : 'CURP'),
              tutor: a.nombre_tutor || a.tutor || 'Tutor',
              telefono: a.telefono_tutor || a.telefono || 'Sin teléfono',
              suscripcion: a.suscripcion || a.estado || 'activa',
              asistenciaHoy: a.asistencia_hoy || 'pendiente',
              horaAsistencia: a.hora_asistencia || '--:--',
              asistenciasTotales: a.asistencias_totales || { presentes: 0, retardos: 0, faltas: 0 },
              calificaciones: a.calificaciones || {},
              qr: a.qr_codigo || a.id,
              qr_codigo: a.qr_codigo || a.id
            }));

            saveState();
          }
          updateTeacherViews();
          renderParentDemoChips();
        }
      } catch (err) {
        console.error("Error al cargar alumnos del servidor:", err);
      }
    }

    // ==========================================================
    // CARGA DE ANUNCIOS DEL MAESTRO DESDE BACKEND
    // ==========================================================
    async function loadTeacherAnnouncements(teacherId) {
      const id = teacherId || localStorage.getItem('currentTeacherId') || maestroState.id;
      if (!id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/anuncios/maestro/${id}`);
        if (res.ok) {
          const rawAnuncios = await res.json();
          if (Array.isArray(rawAnuncios)) {
            anunciosState = rawAnuncios.map((a, idx) => ({
              id: a.id || Date.now() - (idx * 1000),
              fecha: a.created_at ? a.created_at.split('T')[0] : (a.fecha || new Date().toISOString().split('T')[0]),
              titulo: a.titulo || 'Comunicado Escolar',
              categoria: a.categoria || 'General',
              prioridad: a.prioridad || (a.titulo?.toLowerCase().includes('urgente') ? 'Alta' : 'Normal'),
              fijado: Boolean(a.fijado),
              autor: a.autor || maestroState.nombre || 'Docente Titular',
              desc: a.contenido || a.desc || a.texto || '',
              contenido: a.contenido || a.desc || a.texto || ''
            }));
            saveState();
          }
          renderTeacherAnnouncements(anunciosState);
        }
      } catch (err) {
        console.error('Error al cargar anuncios del maestro:', err);
      }
    }

    function renderTeacherAnnouncements(anuncios) {
      renderTeacherAnunciosManagement();
      renderTeacherAnunciosList();
    }

    async function loadTeacherTasks(teacherId) {
      const id = teacherId || localStorage.getItem('currentTeacherId') || maestroState.id;
      if (!id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/tareas/maestro/${id}`);
        if (res.ok) {
          const tareas = await res.json();
          if (Array.isArray(tareas)) {
            tareasState = tareas.map(t => ({
              id: t.id,
              titulo: t.titulo,
              campos: t.campos_formativos || [],
              fechaPub: t.fecha_publicacion,
              fecha: t.fecha_entrega,
              desc: t.instrucciones || '',
              calificaciones: {}
            }));
            saveState();
          }
          renderTasksList(tareasState);
        }
      } catch (err) {
        console.error('Error al cargar tareas:', err);
      }
    }

    async function loadTeacherProjects(teacherId) {
      const id = teacherId || localStorage.getItem('currentTeacherId') || maestroState.id;
      if (!id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/proyectos/maestro/${id}`);
        if (res.ok) {
          const proyectos = await res.json();
          if (Array.isArray(proyectos)) {
            proyectosState = proyectos.map(p => ({
              id: p.id,
              titulo: p.titulo,
              campos: p.campos_formativos || [],
              fechaPub: p.fecha_publicacion,
              fecha: p.fecha_entrega,
              desc: p.instrucciones || '',
              calificaciones: {}
            }));
            saveState();
          }
          renderProjectsList(proyectosState);
        }
      } catch (err) {
        console.error('Error al cargar proyectos:', err);
      }
    }

    async function loadTeacherProjectsAndTasks(teacherId) {
      const id = teacherId || localStorage.getItem('currentTeacherId') || maestroState.id;
      await Promise.all([loadTeacherTasks(id), loadTeacherProjects(id)]);
      updateTeacherViews();
    }

    function openTeacherDashboard() {
      showView('view-portal-maestro');
      switchTeacherTab('dashboard');
      loadTeacherProfile();
      loadTeacherStudents();
      loadTeacherAnnouncements();
      loadTeacherProjectsAndTasks();
      loadTeacherCalendar();
      loadTeacherMessages();
      updateTeacherViews();
    }

    const TEACHER_TABS = [
      { id: 'dashboard', title: 'Panel Principal', subtitle: 'Visión general del ciclo escolar' },
      { id: 'alumnos', title: 'Alumnos & QR', subtitle: 'Gestión y credenciales digitales de acceso' },
      { id: 'asistencias', title: 'Control de Asistencias', subtitle: 'Pase de lista con cámara trasera forzada' },
      { id: 'calificaciones', title: 'Reporte de Evaluación', subtitle: 'Plantilla de materias y promedios oficiales' },
      { id: 'proyectos', title: 'Proyectos Escolares', subtitle: 'Actividades articuladas con Campos Formativos' },
      { id: 'tareas', title: 'Tareas y Asignaciones', subtitle: 'Ejercicios para casa con Campos Formativos' },
      { id: 'anuncios', title: 'Anuncios & Circulares para Familias', subtitle: 'Publica comunicados oficiales y avisos visibles para todos los tutores' },
      { id: 'mensajes', title: 'Bandeja de Mensajes', subtitle: 'Comunicación asíncrona directa con familias' },
      { id: 'reportes', title: 'Módulo de Reportes', subtitle: 'Seguimiento, méritos y citatorios individuales' },
      { id: 'calendario', title: 'Calendario Escolar', subtitle: 'Eventos, entregas y proyectos' },
      { id: 'configuracion', title: 'Configuración', subtitle: 'Preferencias y datos del ciclo escolar' }
    ];

    function switchTeacherTab(tabName) {
      TEACHER_TABS.forEach(t => {
        const viewEl = document.getElementById(`m-view-${t.id}`);
        const btnEl = document.getElementById(`sidebar-tab-${t.id}`);

        if (viewEl) {
          if (t.id === tabName) {
            viewEl.classList.remove('hidden');
            if (btnEl) {
              btnEl.className = "w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all font-bold bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 group";
              const icon = btnEl.querySelector('i');
              if (icon) icon.className = "w-5 h-5 shrink-0 text-brand-600 dark:text-brand-400";
              const span = btnEl.querySelector('span:not(#sidebar-unread-badge):not(#sidebar-anuncios-badge)');
              if (span) span.className = "whitespace-nowrap font-medium text-sm text-left flex-1";
            }

            document.getElementById('topbar-page-title').textContent = t.title;
            document.getElementById('topbar-page-subtitle').textContent = t.subtitle;
          } else {
            viewEl.classList.add('hidden');
            if (btnEl) {
              btnEl.className = "w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:bg-brand-900/40 group";
              const icon = btnEl.querySelector('i');
              if (icon) icon.className = "w-5 h-5 shrink-0 text-slate-400 group-hover:text-brand-600 dark:text-brand-400";
              const span = btnEl.querySelector('span:not(#sidebar-unread-badge):not(#sidebar-anuncios-badge)');
              if (span) span.className = "whitespace-nowrap font-medium text-sm text-left flex-1";
            }
          }
        }
      });

      if (tabName === 'anuncios') {
        renderTeacherAnunciosManagement();
      }

      if (tabName === 'mensajes') {
        renderTeacherMessagesThreads();
      }

      if (tabName === 'calendario') {
        renderCalendario('teacher-calendar-grid');
      }

      if (tabName !== 'asistencias' && isCameraActive) stopQrCamera();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      lucide.createIcons();
    }

    // ==========================================================
    // 4. FLUJO PADRE: ACCESO POR CURP / QR & VISTA INDEPENDIENTE
    // ==========================================================
    function generateSuggestedCURP(nombres, primerApellido, segundoApellido, fechaNac, sexo) {
      const pNom = (nombres || '').trim().toUpperCase();
      const pPat = (primerApellido || '').trim().toUpperCase();
      const pMat = (segundoApellido || '').trim().toUpperCase();
      const s = (sexo || 'M').toUpperCase().startsWith('H') ? 'H' : 'M';

      if (!pNom || !pPat || !fechaNac) {
        return '';
      }

      // 1. Letra inicial del primer apellido
      const c1 = pPat.charAt(0) || 'X';

      // 2. Primera vocal interna del primer apellido
      let c2 = 'X';
      for (let i = 1; i < pPat.length; i++) {
        if ('AEIOUÁÉÍÓÚ'.includes(pPat.charAt(i))) {
          const v = pPat.charAt(i);
          c2 = v === 'Á' ? 'A' : (v === 'É' ? 'E' : (v === 'Í' ? 'I' : (v === 'Ó' ? 'O' : (v === 'Ú' ? 'U' : v))));
          break;
        }
      }

      // 3. Letra inicial del segundo apellido (o X si no tiene)
      const c3 = pMat.length > 0 ? pMat.charAt(0) : 'X';

      // 4. Letra inicial del primer nombre (filtrando Jose/Maria si hay segundo nombre)
      const nameParts = pNom.split(/\s+/);
      let mainName = nameParts[0];
      if (nameParts.length > 1 && (mainName === 'JOSE' || mainName === 'JOSÉ' || mainName === 'MARIA' || mainName === 'MARÍA')) {
        mainName = nameParts[1];
      }
      const c4 = mainName.charAt(0) || 'X';

      // 5. Fecha de nacimiento AAMMDD (6 dígitos)
      const dateParts = fechaNac.split('-'); // YYYY-MM-DD
      let year = '00', month = '01', day = '01';
      if (dateParts.length === 3) {
        year = dateParts[0].slice(-2);
        month = dateParts[1].padStart(2, '0');
        day = dateParts[2].padStart(2, '0');
      }
      const c5_10 = `${year}${month}${day}`;

      // 6. Sexo (H o M) -> Llega exactamente hasta el género (11 caracteres)
      const c11 = s;

      return `${c1}${c2}${c3}${c4}${c5_10}${c11}`.toUpperCase();
    }

    function autoGenerateCurpPreview() {
      const nombres = document.getElementById('alumno_nombres')?.value;
      const paterno = document.getElementById('alumno_paterno')?.value;
      const materno = document.getElementById('alumno_materno')?.value;
      const fecha = document.getElementById('alumno_fecha_nac')?.value;
      const sexo = document.getElementById('alumno_sexo')?.value;
      const curpInput = document.getElementById('alumno_curp');

      if (curpInput && (!curpInput.value || curpInput.dataset.autoGenerated === 'true')) {
        const suggested = generateSuggestedCURP(nombres, paterno, materno, fecha, sexo);
        if (suggested && suggested.length === 11) {
          curpInput.value = suggested;
          curpInput.dataset.autoGenerated = 'true';
        }
      }
    }

    function autoGenerateCurpEditPreview() {
      const nombres = document.getElementById('edit-alumno-nombres')?.value;
      const paterno = document.getElementById('edit-alumno-paterno')?.value;
      const materno = document.getElementById('edit-alumno-materno')?.value;
      const fecha = document.getElementById('edit-alumno-fecha-nac')?.value;
      const sexo = document.getElementById('edit-alumno-sexo')?.value;
      const curpInput = document.getElementById('edit-alumno-curp');

      if (curpInput && (!curpInput.value || curpInput.dataset.autoGenerated === 'true')) {
        const suggested = generateSuggestedCURP(nombres, paterno, materno, fecha, sexo);
        if (suggested && suggested.length === 11) {
          curpInput.value = suggested;
          curpInput.dataset.autoGenerated = 'true';
        }
      }
    }

    function sugerirCURPForm(isEdit = false) {
      const prefix = isEdit ? 'edit-alumno-' : 'alumno_';
      const nombres = document.getElementById(prefix + (isEdit ? 'nombres' : 'nombres'))?.value;
      const paterno = document.getElementById(prefix + (isEdit ? 'paterno' : 'paterno'))?.value;
      const materno = document.getElementById(prefix + (isEdit ? 'materno' : 'materno'))?.value;
      const fecha = document.getElementById(prefix + (isEdit ? 'fecha-nac' : 'fecha_nac'))?.value;
      const sexo = document.getElementById(prefix + (isEdit ? 'sexo' : 'sexo'))?.value;
      const curpInput = document.getElementById(prefix + (isEdit ? 'curp' : 'curp'));

      if (!nombres || !paterno || !fecha) {
        showToast("Ingresa nombre, apellido paterno y fecha de nacimiento primero.", "info");
        return;
      }

      const suggested = generateSuggestedCURP(nombres, paterno, materno, fecha, sexo);
      if (suggested) {
        curpInput.value = suggested;
        curpInput.dataset.autoGenerated = 'true';
        showToast("CURP sugerida generada", "success");
      }
    }

    function handleParentSearchSubmit() {
      const input = document.getElementById('padre_search_input');
      const val = input?.value.trim();
      if (!val) {
        showToast("Por favor ingresa la CURP oficial o Código ID del alumno.", "error");
        return;
      }
      openParentPortalByQuery(val);
    }

    async function openParentPortalByQuery(query) {
      if (!query || !query.trim()) {
        showToast("Por favor ingresa la CURP oficial o Código ID del alumno.", "error");
        return;
      }

      const rawQ = query.trim();
      let q = rawQ.toLowerCase();

      // Soporte si el QR contiene una URL con parámetros o JSON
      if (q.includes('?')) {
        try {
          const urlObj = new URL(rawQ);
          q = (urlObj.searchParams.get('curp') || urlObj.searchParams.get('id') || urlObj.searchParams.get('uuid') || urlObj.searchParams.get('qr') || q).toLowerCase().trim();
        } catch(e) {}
      } else if (rawQ.startsWith('{') && rawQ.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawQ);
          q = (parsed.curp || parsed.uuid || parsed.id || parsed.qr_codigo || q).toLowerCase().trim();
        } catch(e) {}
      }

      let alumno = null;

      // 1. Buscar en memoria local primero
      if (alumnosState && alumnosState.length > 0) {
        alumno = alumnosState.find(a => {
          const curp = (a.curp || '').toLowerCase().trim();
          const uuid = (a.uuid || '').toLowerCase().trim();
          const id = a.id !== undefined ? String(a.id).toLowerCase().trim() : '';
          const qr = (a.qr_codigo || a.qr || '').toLowerCase().trim();
          const nombre = (a.nombre || a.nombre_completo || '').toLowerCase().trim();

          return (curp && (curp === q || q.includes(curp) || curp.includes(q))) ||
                 (uuid && (uuid === q || q.includes(uuid) || uuid.includes(q))) ||
                 (id && (id === q || q.includes(id) || id.includes(q))) ||
                 (qr && (qr === q || q.includes(qr) || qr.includes(q))) ||
                 (nombre && (nombre === q || nombre.includes(q) || q.includes(nombre)));
        });
      }

      // 2. Si no se encontró en memoria local, consultar la base de datos (Backend API)
      if (!alumno) {
        try {
          const res = await fetch(`${API_BASE_URL}/alumnos/consulta/${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.alumno) {
              const bAlu = data.alumno;
              alumno = {
                id: bAlu.id,
                uuid: bAlu.id,
                id_maestro: bAlu.id_maestro,
                nombre: bAlu.nombre_completo || 'Alumno',
                nombre_completo: bAlu.nombre_completo || 'Alumno',
                nombres: bAlu.nombre_completo ? bAlu.nombre_completo.split(' ')[0] : 'Alumno',
                tutor: bAlu.nombre_tutor || 'Tutor',
                telefono: bAlu.telefono_tutor || 'Sin teléfono',
                curp: bAlu.curp || (bAlu.id ? bAlu.id.substring(0, 11).toUpperCase() : 'CURP'),
                qr_codigo: bAlu.qr_codigo || bAlu.id,
                asistenciaHoy: bAlu.asistencia_hoy || 'pendiente',
                horaAsistencia: bAlu.hora_asistencia || '--:--',
                asistenciasTotales: bAlu.asistencias_totales || { presentes: 0, retardos: 0, faltas: 0 },
                calificaciones: bAlu.calificaciones || {},
                maestro: bAlu.maestro || null
              };
            }
          }
        } catch (err) {
          console.warn("No se pudo consultar el alumno en el backend:", err);
        }
      }

      if (!alumno) {
        showToast("No se encontró ningún alumno con esa CURP o Código. Verifica los datos.", "error");
        return;
      }

      playScanChime('success');
      if (isParentCameraActive) stopParentQrCamera();

      currentParentStudent = alumno;
      renderParentPortal(alumno);
      loadParentDashboard(alumno);
      showView('view-portal-padres');
      showToast(`Reporte de Evaluación de ${alumno.nombre} cargado`, "success");
    }

    function openParentPortalByUuid(uuidQuery) {
      openParentPortalByQuery(uuidQuery);
    }

    // ==========================================================
    // VISTA DEL PADRE / TUTOR (CARGA DE DATOS AISLADOS)
    // ==========================================================
    async function loadParentDashboard(alumno) {
      if (!alumno) return;
      const teacherId = alumno.id_maestro || alumno.maestro?.id || maestroState.id;
      const studentId = alumno.id || alumno.uuid;

      // 1. Cargar únicamente los anuncios del salón de su maestro
      if (teacherId) {
        try {
          const resAnuncios = await fetch(`${API_BASE_URL}/anuncios/maestro/${teacherId}`);
          if (resAnuncios.ok) {
            const rawAnuncios = await resAnuncios.json();
            if (Array.isArray(rawAnuncios)) {
              const anunciosSalon = rawAnuncios.map((a, idx) => ({
                id: a.id || Date.now() - (idx * 1000),
                fecha: a.created_at ? a.created_at.split('T')[0] : (a.fecha || new Date().toISOString().split('T')[0]),
                titulo: a.titulo || 'Comunicado Escolar',
                categoria: a.categoria || 'General',
                prioridad: a.prioridad || (a.titulo?.toLowerCase().includes('urgente') ? 'Alta' : 'Normal'),
                fijado: Boolean(a.fijado),
                autor: a.autor || alumno.maestro?.nombre || maestroState.nombre || 'Docente Titular',
                desc: a.contenido || a.desc || a.texto || '',
                contenido: a.contenido || a.desc || a.texto || ''
              }));
              renderParentAnnouncements(anunciosSalon);
            }
          }
        } catch (err) {
          console.error('Error al cargar anuncios para el tutor:', err);
        }
      }

      // 2. Cargar únicamente los mensajes privados de este alumno
      if (studentId) {
        try {
          const resMensajes = await fetch(`${API_BASE_URL}/mensajes/alumno/${studentId}`);
          if (resMensajes.ok) {
            const rawMensajes = await resMensajes.json();
            if (Array.isArray(rawMensajes)) {
              renderParentMessages(rawMensajes, alumno);
            }
          }
        } catch (err) {
          console.error('Error al cargar mensajes del alumno:', err);
        }
      }

      // 3. Cargar calificaciones aisladas del alumno desde el backend
      if (studentId) {
        try {
          const resCal = await fetch(`${API_BASE_URL}/calificaciones/alumno/${studentId}`);
          if (resCal.ok) {
            const rawCal = await resCal.json();
            if (Array.isArray(rawCal) && rawCal.length > 0) {
              if (!alumno.calificaciones) alumno.calificaciones = {};
              rawCal.forEach(c => {
                if (c.materia && c.calificacion !== undefined) {
                  alumno.calificaciones[c.materia] = Math.round(parseFloat(c.calificacion) || 0);
                }
              });
              renderParentPortal(alumno);
            }
          }
        } catch (err) {
          console.error('Error al cargar calificaciones del alumno:', err);
        }
      }

      // 4. Cargar historial de asistencias aislado del alumno desde el backend
      if (studentId) {
        try {
          const resAsis = await fetch(`${API_BASE_URL}/asistencias/alumno/${studentId}`);
          if (resAsis.ok) {
            const rawAsis = await resAsis.json();
            if (Array.isArray(rawAsis) && rawAsis.length > 0) {
              let pres = 0, ret = 0, falt = 0;
              rawAsis.forEach(as => {
                const est = (as.estado || '').toLowerCase();
                if (est === 'asistencia' || est === 'presente') pres++;
                else if (est === 'retardo') ret++;
                else if (est === 'falta') falt++;
              });
              alumno.asistenciasTotales = { presentes: pres, retardos: ret, faltas: falt };
              
              const hoy = new Date().toISOString().split('T')[0];
              const asisHoy = rawAsis.find(as => as.fecha && as.fecha.startsWith(hoy));
              if (asisHoy) {
                const estHoy = (asisHoy.estado || '').toLowerCase();
                alumno.asistenciaHoy = (estHoy === 'asistencia' || estHoy === 'presente') ? 'presente' : estHoy;
              }
              renderParentPortal(alumno);
            }
          }
        } catch (err) {
          console.error('Error al cargar asistencias del alumno:', err);
        }
      }

      // 5. Cargar tareas y proyectos activos del maestro asignado al alumno
      if (teacherId) {
        try {
          const [resTareas, resProyectos] = await Promise.all([
            fetch(`${API_BASE_URL}/tareas/maestro/${teacherId}`),
            fetch(`${API_BASE_URL}/proyectos/maestro/${teacherId}`)
          ]);

          if (resTareas.ok) {
            const tareas = await resTareas.json();
            if (Array.isArray(tareas)) {
              tareasState = tareas.map(t => ({
                id: t.id,
                titulo: t.titulo,
                campos: t.campos_formativos || [],
                fechaPub: t.fecha_publicacion,
                fecha: t.fecha_entrega,
                desc: t.instrucciones || '',
                calificaciones: {}
              }));
            }
            renderParentTasks(tareas);
          }
          if (resProyectos.ok) {
            const proyectos = await resProyectos.json();
            if (Array.isArray(proyectos)) {
              proyectosState = proyectos.map(p => ({
                id: p.id,
                titulo: p.titulo,
                campos: p.campos_formativos || [],
                fechaPub: p.fecha_publicacion,
                fecha: p.fecha_entrega,
                desc: p.instrucciones || '',
                calificaciones: {}
              }));
            }
            renderParentProjects(proyectos);
          }
        } catch (err) {
          console.error('Error al cargar tareas/proyectos en el portal del padre:', err);
        }
      }
    }

    function renderParentPortal(alumno) {
      // 1. Datos del Alumno
      const initial = (alumno.nombre || alumno.nombre_completo || 'A').charAt(0).toUpperCase();
      document.getElementById('p-avatar').textContent = initial;
      document.getElementById('p-nombre').textContent = alumno.nombre || alumno.nombre_completo || 'Alumno';
      
      const curpBadge = document.getElementById('p-curp-badge');
      if (curpBadge) {
        curpBadge.textContent = `CURP / ID: ${alumno.curp || (alumno.id ? alumno.id.substring(0, 11).toUpperCase() : (alumno.uuid ? alumno.uuid.substring(0, 11).toUpperCase() : 'SIN-CURP'))}`;
      }

      const maestroGrupo = alumno.maestro?.grupo || maestroState.grupo || 'Grupo Escolar';
      const maestroNombre = alumno.maestro?.nombre || maestroState.nombre || 'Docente Titular';
      const tutorNombre = alumno.tutor || alumno.nombre_tutor || 'Tutor';

      document.getElementById('p-grupo-tutor').textContent = `${maestroGrupo} • Tutor: ${tutorNombre}`;
      document.getElementById('p-profesor').textContent = `Docente Titular: ${maestroNombre}`;
      document.getElementById('p_msg_tutor_name').value = tutorNombre;

      // 2. Asistencias
      const att = alumno.asistenciasTotales || { presentes: 0, retardos: 0, faltas: 0 };
      const total = (att.presentes + att.retardos + att.faltas);
      const rate = total > 0 ? Math.round(((att.presentes + (att.retardos * 0.5)) / total) * 100) : 100;

      document.getElementById('p-asist-presentes').textContent = att.presentes;
      document.getElementById('p-asist-retardos').textContent = att.retardos;
      document.getElementById('p-asist-faltas').textContent = att.faltas;
      document.getElementById('p-asist-rate-badge').textContent = total > 0 ? `${rate}%` : '--%';
      
      let hoyTexto = 'Pendiente / Sin registrar';
      if (alumno.asistenciaHoy === 'presente') {
        hoyTexto = `Presente (${alumno.horaAsistencia || 'A tiempo'})`;
      } else if (alumno.asistenciaHoy === 'retardo') {
        hoyTexto = `Retardo (${alumno.horaAsistencia || 'Tarde'})`;
      } else if (alumno.asistenciaHoy === 'falta') {
        hoyTexto = 'Inasistencia / Falta';
      }
      document.getElementById('p-asist-hoy-badge').textContent = hoyTexto;

      // 3. Reporte de Evaluación (Materias Enteras • Promedio con Decimales)
      const matContainer = document.getElementById('p-materias-list');
      let sum = 0, count = 0;

      matContainer.innerHTML = materiasState.map(m => {
        const hasCal = (alumno.calificaciones && alumno.calificaciones[m] !== undefined && alumno.calificaciones[m] !== null && alumno.calificaciones[m] !== '');
        const cal = hasCal ? Math.round(parseFloat(alumno.calificaciones[m]) || 0) : '-';
        if (hasCal) {
          sum += cal;
          count++;
        }
        return `
          <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span class="font-bold text-slate-800 dark:text-slate-200">${m}</span>
            <span class="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold ${hasCal ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400'} text-xs shadow-2xs">
              ${cal}
            </span>
          </div>
        `;
      }).join('');

      const avgDecimal = count > 0 ? (sum / count).toFixed(1) : 'Sin calificar';
      document.getElementById('p-promedio-general').textContent = `Promedio General: ${avgDecimal}`;

      // 4. Proyectos Escolares
      renderParentProjects();

      // 5. Tareas Escolares
      renderParentTasks();

      // 6. Mensajes y Tickets de este Alumno
      renderParentChatHistory(alumno.uuid);

      // 6.5 Renderizar Anuncios Generales
      renderAnunciosPadres();

      // 6.6 Renderizar Calendario Padres
      renderCalendario('parent-calendar-grid');

      // 7. Reportes y Avisos
      const repContainer = document.getElementById('p-reportes-list');
      const studentReports = reportesState.filter(r => r.alumnoUuid === alumno.uuid);
      document.getElementById('p-reportes-count').textContent = `${studentReports.length} Registros`;

      if (studentReports.length === 0) {
        repContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-300 text-center py-4">Excelente: Sin reportes de conducta registrados.</p>';
      } else {
        repContainer.innerHTML = studentReports.map(r => `
          <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/80 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-800/60">${r.tipo}</span>
              <span class="text-[10px] text-slate-500 dark:text-slate-300">${r.fecha}</span>
            </div>
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-xs">${r.titulo}</h4>
            <p class="text-[11px] text-slate-600 dark:text-slate-200 leading-relaxed">${r.desc}</p>
          </div>
        `).join('');
      }

      lucide.createIcons();
    }

    function renderParentProjects(customProjects = null) {
      const projContainer = document.getElementById('p-proyectos-list');
      if (!projContainer) return;
      const list = customProjects !== null ? customProjects : proyectosState;

      if (!list || list.length === 0) {
        projContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-300 text-center py-4">No hay proyectos activos asignados.</p>';
        return;
      }

      const currentStudentId = currentParentStudent?.uuid || currentParentStudent?.id;
      projContainer.innerHTML = list.map(p => {
        const studentNote = p.calificaciones && currentStudentId && (p.calificaciones[currentStudentId] || p.calificaciones[p.id]);
        const noteText = studentNote !== undefined ? `Nota: ${studentNote}` : 'Pendiente';
        const camposList = p.campos_formativos || p.campos || [];
        const camposBadges = camposList.map(c => `
          <span class="text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60">${c}</span>
        `).join(' ');

        return `
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex flex-wrap gap-1">${camposBadges}</div>
              <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md shrink-0 border border-emerald-100 dark:border-emerald-800/60">${noteText}</span>
            </div>
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-xs">${p.titulo}</h4>
            <p class="text-[11px] text-slate-600 dark:text-slate-200 leading-relaxed">${p.instrucciones || p.desc || ''}</p>
            <div class="text-[10px] text-slate-500 dark:text-slate-300 flex items-center justify-between pt-1">
              <span>Entrega: ${p.fecha_entrega || p.fecha || 'Sin fecha'}</span>
              <span class="text-indigo-600 dark:text-indigo-300 font-semibold">Proyecto Integrador</span>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderParentTasks(customTasks = null) {
      const tareasContainer = document.getElementById('p-tareas-list');
      if (!tareasContainer) return;
      const list = customTasks !== null ? customTasks : tareasState;

      if (!list || list.length === 0) {
        tareasContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-300 text-center py-4">No hay tareas asignadas para casa.</p>';
        return;
      }

      const currentStudentId = currentParentStudent?.uuid || currentParentStudent?.id;
      tareasContainer.innerHTML = list.map(t => {
        const studentNote = t.calificaciones && currentStudentId && (t.calificaciones[currentStudentId] || t.calificaciones[t.id]);
        const noteText = studentNote !== undefined ? `Nota: ${studentNote}` : 'Pendiente';
        const camposList = t.campos_formativos || t.campos || [];
        const camposBadges = camposList.map(c => `
          <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/60">${c}</span>
        `).join(' ');

        return `
          <div class="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex flex-wrap gap-1">${camposBadges}</div>
              <span class="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md shrink-0 border border-indigo-100 dark:border-indigo-800/60">${noteText}</span>
            </div>
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-xs">${t.titulo}</h4>
            <p class="text-[11px] text-slate-600 dark:text-slate-200 leading-relaxed">${t.instrucciones || t.desc || ''}</p>
            <div class="text-[10px] text-slate-500 dark:text-slate-300 flex items-center justify-between pt-1">
              <span>Entrega: ${t.fecha_entrega || t.fecha || 'Sin fecha'}</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Tarea en Casa</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Modal Escáner QR de Padres
    let isParentScanProcessing = false;

    function toggleParentScannerModal() {
      const modal = document.getElementById('modal-parent-scanner');
      if (modal.classList.contains('hidden')) {
        openParentScannerModal();
      } else {
        closeParentScannerModal();
      }
    }

    function openParentScannerModal() {
      const modal = document.getElementById('modal-parent-scanner');
      modal.classList.remove('hidden');
      isParentScanProcessing = false;
      startParentQrCamera();
      lucide.createIcons();
    }

    function closeParentScannerModal() {
      const modal = document.getElementById('modal-parent-scanner');
      modal.classList.add('hidden');
      stopParentQrCamera();
      lucide.createIcons();
    }

    async function startParentQrCamera() {
      isParentCameraActive = true;
      isParentScanProcessing = false;
      const placeholder = document.getElementById('parent-scanner-placeholder');
      if (placeholder) placeholder.classList.remove('hidden');

      try {
        if (parentHtml5QrScannerInstance) {
          try {
            await parentHtml5QrScannerInstance.stop();
            parentHtml5QrScannerInstance.clear();
          } catch(e) {}
        }
        parentHtml5QrScannerInstance = new Html5Qrcode("parent-qr-reader");
        const scanConfig = { fps: 10, qrbox: { width: 200, height: 200 } };
        const onScanSuccess = (decodedText) => {
          if (isParentScanProcessing) return;
          isParentScanProcessing = true;
          closeParentScannerModal();
          openParentPortalByUuid(decodedText);
        };

        await startScannerForcingBackCamera(parentHtml5QrScannerInstance, scanConfig, onScanSuccess);
        if (placeholder) placeholder.classList.add('hidden');
      } catch (e) {
        if (placeholder) placeholder.classList.remove('hidden');
        showToast("No se pudo iniciar la cámara trasera.", "error");
        isParentCameraActive = false;
      }
    }

    async function stopParentQrCamera() {
      isParentCameraActive = false;
      if (parentHtml5QrScannerInstance) {
        try {
          await parentHtml5QrScannerInstance.stop();
          parentHtml5QrScannerInstance.clear();
        } catch (e) {}
        parentHtml5QrScannerInstance = null;
      }
    }

    function renderParentDemoChips() {
      const container = document.getElementById('parent-auth-demo-chips');
      if (!container) return;
      container.innerHTML = alumnosState.slice(0, 3).map(a => `
        <button onclick="openParentPortalByQuery('${a.curp || a.uuid}')" class="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold text-[11px] transition-all cursor-pointer">
          ${a.nombres || a.nombre.split(' ')[0]} (CURP: ${(a.curp || a.uuid).substring(0, 10)}...)
        </button>
      `).join('');
    }

    // ==========================================================
    // 5. MOTOR DE INICIO DE CÁMARA (FORZANDO CÁMARA TRASERA)
    // ==========================================================
    async function startScannerForcingBackCamera(scannerInstance, config, successCallback) {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCamera = devices.find(device => {
            const label = (device.label || '').toLowerCase();
            return label.includes('back') ||
                   label.includes('rear') ||
                   label.includes('trasera') ||
                   label.includes('posterior') ||
                   label.includes('ambiente') ||
                   label.includes('0, facing back');
          });

          const targetDeviceId = backCamera
            ? backCamera.id
            : (devices.length > 1 ? devices[devices.length - 1].id : devices[0].id);

          return await scannerInstance.start(
            targetDeviceId,
            config,
            successCallback,
            () => {}
          );
        }
      } catch (err) {
        console.warn("Enumeración de cámaras no disponible, aplicando constraints WebRTC:", err);
      }

      try {
        return await scannerInstance.start(
          { facingMode: { exact: "environment" } },
          config,
          successCallback,
          () => {}
        );
      } catch (exactErr) {
        return await scannerInstance.start(
          { facingMode: "environment" },
          config,
          successCallback,
          () => {}
        );
      }
    }

    // ==========================================================
    // 6. ASISTENCIAS & ESCÁNER DOCENTE (CÁMARA TRASERA FORZADA)
    // ==========================================================
    function toggleQrCamera() {
      if (isCameraActive) stopQrCamera();
      else startQrCamera();
    }

    async function startQrCamera() {
      const placeholder = document.getElementById('scanner-placeholder');
      const btnText = document.getElementById('btn-camera-text');
      if (placeholder) placeholder.classList.remove('hidden');
      isCameraActive = true;
      if (btnText) btnText.textContent = "Detener Cámara Trasera";

      try {
        if (html5QrScannerInstance) {
          try {
            await html5QrScannerInstance.stop();
            html5QrScannerInstance.clear();
          } catch(e) {}
        }
        html5QrScannerInstance = new Html5Qrcode("qr-reader");
        const scanConfig = { fps: 10, qrbox: { width: 190, height: 190 } };
        const onScanSuccess = (decodedText) => handleAttendanceScan(decodedText);

        await startScannerForcingBackCamera(html5QrScannerInstance, scanConfig, onScanSuccess);
        if (placeholder) placeholder.classList.add('hidden');
      } catch (e) {
        showToast("No se pudo iniciar la cámara trasera.", "error");
        stopQrCamera();
      }
    }

    async function stopQrCamera() {
      if (html5QrScannerInstance) {
        try {
          await html5QrScannerInstance.stop();
          html5QrScannerInstance.clear();
        } catch(e) {}
        html5QrScannerInstance = null;
      }
      document.getElementById('scanner-placeholder')?.classList.remove('hidden');
      const btnText = document.getElementById('btn-camera-text');
      if (btnText) btnText.textContent = "Activar Cámara Trasera";
      isCameraActive = false;
    }

    function handleManualScan() {
      const input = document.getElementById('manual-scan-input');
      const val = input?.value.trim();
      if (!val) return;
      handleAttendanceScan(val);
      input.value = '';
    }

    let lastAttendanceScanTime = 0;
    let lastAttendanceScannedCode = '';

    function handleAttendanceScan(scannedCode) {
      const now = Date.now();
      const rawQ = (scannedCode || '').trim();
      if (!rawQ) return;

      // Cooldown de 2.5s para el mismo código y 600ms entre distintos
      if (rawQ === lastAttendanceScannedCode && (now - lastAttendanceScanTime) < 2500) {
        return;
      }
      if ((now - lastAttendanceScanTime) < 600) {
        return;
      }
      lastAttendanceScanTime = now;
      lastAttendanceScannedCode = rawQ;

      const q = rawQ.toLowerCase();
      const a = alumnosState.find(x => 
        (x.curp && x.curp.toLowerCase().trim() === q) ||
        (x.uuid && x.uuid.toLowerCase() === q) || 
        (x.uuid && x.uuid.toLowerCase().includes(q))
      );
      if (!a) {
        playScanChime('error');
        showToast("Código QR / CURP no reconocido en el grupo.", "error");
        return;
      }

      playScanChime('success');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const prevStatus = a.asistenciaHoy || 'pendiente';
      a.asistenciaHoy = 'presente';
      a.horaAsistencia = timeStr;
      if (!a.asistenciasTotales) a.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
      
      if (prevStatus !== 'presente') {
        if (prevStatus === 'retardo' && a.asistenciasTotales.retardos > 0) a.asistenciasTotales.retardos -= 1;
        if (prevStatus === 'falta' && a.asistenciasTotales.faltas > 0) a.asistenciasTotales.faltas -= 1;
        a.asistenciasTotales.presentes += 1;
      }

      document.getElementById('last-scan-name').textContent = a.nombre;
      document.getElementById('last-scan-meta').textContent = `Hora: ${timeStr} • A tiempo`;
      document.getElementById('last-scan-feedback').classList.remove('hidden');

      saveState();
      showToast(`Asistencia confirmada: ${a.nombre}`, "success");
      updateTeacherViews();
    }

    function markAllAttendance(status) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      alumnosState.forEach(a => {
        const prevStatus = a.asistenciaHoy || 'pendiente';
        a.asistenciaHoy = status;
        a.horaAsistencia = (status === 'presente' || status === 'retardo') ? timeStr : '--:--';
        if (!a.asistenciasTotales) a.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
        
        if (prevStatus === 'presente' && a.asistenciasTotales.presentes > 0) a.asistenciasTotales.presentes -= 1;
        if (prevStatus === 'retardo' && a.asistenciasTotales.retardos > 0) a.asistenciasTotales.retardos -= 1;
        if (prevStatus === 'falta' && a.asistenciasTotales.faltas > 0) a.asistenciasTotales.faltas -= 1;

        if (status === 'presente') a.asistenciasTotales.presentes += 1;
        if (status === 'retardo') a.asistenciasTotales.retardos += 1;
        if (status === 'falta') a.asistenciasTotales.faltas += 1;
      });
      saveState();
      updateTeacherViews();
      showToast("Todos marcados como " + status, "success");
    }

    function setAlumnoAttendance(uuid, status) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;

      const prevStatus = a.asistenciaHoy || 'pendiente';
      a.asistenciaHoy = status;
      a.horaAsistencia = (status === 'presente' || status === 'retardo') ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
      
      if (!a.asistenciasTotales) a.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
      
      if (prevStatus === 'presente' && a.asistenciasTotales.presentes > 0) a.asistenciasTotales.presentes -= 1;
      if (prevStatus === 'retardo' && a.asistenciasTotales.retardos > 0) a.asistenciasTotales.retardos -= 1;
      if (prevStatus === 'falta' && a.asistenciasTotales.faltas > 0) a.asistenciasTotales.faltas -= 1;

      if (status === 'presente') a.asistenciasTotales.presentes += 1;
      if (status === 'retardo') a.asistenciasTotales.retardos += 1;
      if (status === 'falta') a.asistenciasTotales.faltas += 1;

      saveState();
      updateTeacherViews();

      // Sincronizar asistencia con backend
      const teacherId = localStorage.getItem('currentTeacherId') || a.id_maestro || maestroState.id;
      const studentId = a.id || a.uuid;
      if (teacherId && studentId && status !== 'pendiente') {
        fetch(`${API_BASE_URL}/asistencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_alumno: studentId,
            id_maestro: teacherId,
            estado: status,
            fecha: new Date().toISOString().split('T')[0]
          })
        }).catch(err => console.warn("No se pudo registrar asistencia en backend:", err));
      }
    }

    let currentAsistFilter = 'todos';

    function setAsistFilter(status) {
      currentAsistFilter = status;
      ['todos', 'presente', 'retardo', 'falta', 'pendiente'].forEach(s => {
        const btn = document.getElementById(`filter-btn-asist-${s}`);
        if (btn) {
          if (s === status) {
            btn.className = "px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold transition-all cursor-pointer shadow-xs";
          } else {
            btn.className = "px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer";
          }
        }
      });
      filterAttendanceTable();
    }

    function filterAttendanceTable() {
      const q = document.getElementById('asist-search-input')?.value.toLowerCase().trim() || '';
      const filtered = alumnosState.filter(a => {
        const matchStatus = currentAsistFilter === 'todos' || a.asistenciaHoy === currentAsistFilter;
        const matchQuery = !q || a.nombre.toLowerCase().includes(q) || a.tutor.toLowerCase().includes(q);
        return matchStatus && matchQuery;
      });
      renderAttendanceTable(filtered);
    }

    function renderAttendanceTable(customData = null) {
      const tbody = document.getElementById('attendance-table-body');
      const data = customData || alumnosState;
      const countBadge = document.getElementById('asist-count-badge');
      if (countBadge) countBadge.textContent = `${data.length} Alumnos`;

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-8"><div class="flex flex-col items-center justify-center gap-2 text-slate-400"><i data-lucide="scan-line" class="w-8 h-8 text-slate-300"></i><p class="text-sm font-semibold text-slate-500">Sin alumnos que coincidan con la búsqueda</p></div></td></tr>`;
        lucide.createIcons();
        return;
      }

      tbody.innerHTML = data.map(a => {
        let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
        if (a.asistenciaHoy === 'presente') badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        if (a.asistenciaHoy === 'falta') badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200';
        if (a.asistenciaHoy === 'retardo') badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';

        return `
          <tr class="hover:bg-slate-50 dark:bg-slate-800 transition-colors">
            <td class="px-4 py-3">
              <div class="font-semibold text-slate-900 dark:text-slate-100">${a.nombre}</div>
              <div class="text-[10px] text-slate-400">${a.tutor}</div>
            </td>
            <td class="px-4 py-3">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeColor}">
                ${a.asistenciaHoy}
              </span>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">${a.horaAsistencia}</td>
            <td class="px-4 py-3 text-right space-x-1">
              <button onclick="setAlumnoAttendance('${a.uuid}', 'presente')" title="Presente" class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer">P</button>
              <button onclick="setAlumnoAttendance('${a.uuid}', 'retardo')" title="Retardo" class="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold transition-all cursor-pointer">R</button>
              <button onclick="setAlumnoAttendance('${a.uuid}', 'falta')" title="Falta" class="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold transition-all cursor-pointer">F</button>
            </td>
          </tr>
        `;
      }).join('');
      lucide.createIcons();
    }

    // ==========================================================
    // 7. SISTEMA DE MENSAJERÍA ASÍNCRONA (DOCENTE & FAMILIAS)
    // ==========================================================
    async function loadTeacherMessages(filterQuery = '') {
      const currentTeacherId = localStorage.getItem('currentTeacherId') || maestroState.id || 1;

      try {
        const res = await fetch(`${API_BASE_URL}/mensajes/maestro/${currentTeacherId}`);
        if (res.ok) {
          const data = await res.json();
          const serverMessages = Array.isArray(data) ? data : (data.datos || data.mensajes || []);

          if (serverMessages && serverMessages.length > 0) {
            const grouped = {};

            serverMessages.forEach(msg => {
              const alumnoId = msg.id_alumno;
              if (!alumnoId) return;

              if (!grouped[alumnoId]) {
                const student = alumnosState.find(a => a.uuid === alumnoId || String(a.id) === String(alumnoId) || a.curp === alumnoId);
                grouped[alumnoId] = {
                  id: alumnoId,
                  alumnoUuid: alumnoId,
                  asunto: msg.asunto || 'Mensaje Escolar',
                  leidoPorMaestro: true,
                  mensajes: []
                };
              }

              const isMe = msg.enviado_por === 'maestro';
              const student = alumnosState.find(a => a.uuid === alumnoId || String(a.id) === String(alumnoId) || a.curp === alumnoId);
              const autor = isMe 
                ? (maestroState.nombre || 'Prof. Carlos Mendoza') 
                : (student?.tutor ? `${student.tutor} (Tutor)` : 'Padre / Tutor');

              let formattedDate = 'Hoy';
              if (msg.created_at || msg.fecha) {
                const d = new Date(msg.created_at || msg.fecha);
                if (!isNaN(d.getTime())) {
                  formattedDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                } else {
                  formattedDate = msg.created_at || msg.fecha;
                }
              }

              grouped[alumnoId].mensajes.push({
                id: msg.id,
                remitente: isMe ? 'maestro' : 'padre',
                enviado_por: msg.enviado_por,
                autor: autor,
                texto: msg.texto,
                fecha: formattedDate,
                asunto: msg.asunto
              });

              if (!isMe && msg.asunto) {
                grouped[alumnoId].asunto = msg.asunto;
              }
            });

            Object.values(grouped).forEach(th => {
              th.mensajes.sort((a, b) => (new Date(a.fecha) - new Date(b.fecha)) || ((a.id || 0) - (b.id || 0)));
            });

            mensajesState = Object.values(grouped);
            saveState();
          }
        }
      } catch (err) {
        console.warn("Servidor no disponible para cargar mensajes del maestro:", err);
      }

      renderTeacherMessagesThreads(filterQuery);
    }

    function renderTeacherMessagesThreads(filterQuery = '') {
      const container = document.getElementById('teacher-threads-list');
      const q = filterQuery.toLowerCase().trim();

      const threads = mensajesState.filter(th => {
        const a = alumnosState.find(x => x.uuid === th.alumnoUuid) || { nombre: 'Alumno', tutor: 'Tutor' };
        return !q || a.nombre.toLowerCase().includes(q) || a.tutor.toLowerCase().includes(q) || th.asunto.toLowerCase().includes(q);
      });

      document.getElementById('teacher-inbox-stats').textContent = `${threads.length} Conversaciones`;

      if (threads.length === 0) {
        container.innerHTML = `<div class="p-8 flex flex-col items-center justify-center gap-3 text-center"><i data-lucide="inbox" class="w-10 h-10 text-slate-300"></i><div><p class="text-sm font-bold text-slate-700 dark:text-slate-300">Bandeja vacía</p><p class="text-[11px] text-slate-400">No hay mensajes que coincidan con la búsqueda o el grupo no tiene mensajes aún.</p></div></div>`;
        return;
      }

      container.innerHTML = threads.map(th => {
        const a = alumnosState.find(x => x.uuid === th.alumnoUuid) || { nombre: 'Alumno', tutor: 'Tutor' };
        const lastMsg = th.mensajes[th.mensajes.length - 1] || { texto: '', fecha: '' };
        const isSelected = th.id === selectedThreadId;
        const isUnread = !th.leidoPorMaestro;

        return `
          <div
            onclick="selectTeacherThread(${th.id})"
            class="p-4 cursor-pointer transition-all ${isSelected ? 'bg-brand-50 dark:bg-brand-900/40/80 border-l-4 border-brand-600' : 'hover:bg-slate-50 dark:bg-slate-800'} ${isUnread ? 'bg-indigo-50 dark:bg-indigo-900/40/30 font-semibold' : ''}"
          >
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">${a.nombre}</h4>
              <span class="text-[10px] text-slate-400 shrink-0">${lastMsg.fecha.split(' ')[1] || ''}</span>
            </div>
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="text-[11px] text-brand-700 dark:text-brand-300 font-semibold truncate">${th.asunto}</span>
              ${isUnread ? '<span class="px-1.5 py-0.5 text-[9px] font-bold bg-brand-600 text-white rounded-md shrink-0">Nuevo</span>' : '<span class="text-[10px] text-slate-400 shrink-0">Leído</span>'}
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">${lastMsg.texto}</p>
          </div>
        `;
      }).join('');

      renderTeacherSelectedThread();
      updateUnreadBadges();
      lucide.createIcons();
    }

    function selectTeacherThread(threadId) {
      selectedThreadId = threadId;
      const th = mensajesState.find(x => x.id === threadId);
      if (th) {
        th.leidoPorMaestro = true;
        saveState();
      }
      renderTeacherMessagesThreads();
    }

    function renderTeacherSelectedThread() {
      const th = mensajesState.find(x => x.id === selectedThreadId) || mensajesState[0];
      if (!th) return;

      const a = alumnosState.find(x => x.uuid === th.alumnoUuid) || { nombre: 'Alumno', tutor: 'Tutor' };

      document.getElementById('thread-student-avatar').textContent = a.nombre.charAt(0).toUpperCase();
      document.getElementById('thread-student-name').textContent = a.nombre;
      document.getElementById('thread-tutor-info').textContent = `Tutor: ${a.tutor} • ${th.asunto}`;

      const lastMsg = th.mensajes[th.mensajes.length - 1];
      document.getElementById('thread-last-date').textContent = lastMsg ? lastMsg.fecha : 'Hoy';

      const body = document.getElementById('thread-messages-body');
      const isJustificante = th.asunto && th.asunto.toLowerCase().includes('justificante');
      const quickActionHtml = `
        <div class="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs mb-2">
          <div class="flex items-center gap-2">
            <i data-lucide="${isJustificante ? 'file-check' : 'user-check'}" class="w-4 h-4 text-brand-600 dark:text-brand-400"></i>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Acciones del Alumno:</span>
          </div>
          <div class="flex items-center gap-2">
            ${isJustificante ? `
              <button onclick="handleQuickJustify('${th.alumnoUuid}', ${th.id})" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Justificar Falta de Hoy</span>
              </button>
            ` : ''}
            <button onclick="openBoletaModal('${th.alumnoUuid}')" class="px-2.5 py-1 bg-brand-50 dark:bg-brand-900/40 hover:bg-brand-100 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
              <span>Ver Boleta</span>
            </button>
          </div>
        </div>
      `;

      body.innerHTML = quickActionHtml + th.mensajes.map(m => {
        const isMe = m.remitente === 'maestro';
        return `
          <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
            <div class="max-w-md ${isMe ? 'bg-brand-600 text-white rounded-2xl rounded-tr-xs' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-2xl rounded-tl-xs shadow-2xs'} p-3.5 space-y-1">
              <div class="flex items-center justify-between gap-3 text-[10px] ${isMe ? 'text-brand-200' : 'text-slate-400'} font-bold">
                <span>${m.autor}</span>
                <span>${m.fecha}</span>
              </div>
              <p class="text-xs leading-relaxed whitespace-pre-wrap">${m.texto}</p>
            </div>
          </div>
        `;
      }).join('');

      body.scrollTop = body.scrollHeight;
    }

    function handleQuickJustify(alumnoUuid, threadId) {
      const alumno = alumnosState.find(a => a.uuid === alumnoUuid);
      if (!alumno) return;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const prevStatus = alumno.asistenciaHoy || 'pendiente';
      alumno.asistenciaHoy = 'presente';
      alumno.horaAsistencia = `${timeStr} (Justificado)`;
      if (!alumno.asistenciasTotales) alumno.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
      
      if (prevStatus !== 'presente') {
        if (prevStatus === 'retardo' && alumno.asistenciasTotales.retardos > 0) alumno.asistenciasTotales.retardos -= 1;
        if (prevStatus === 'falta' && alumno.asistenciasTotales.faltas > 0) alumno.asistenciasTotales.faltas -= 1;
        alumno.asistenciasTotales.presentes += 1;
      }

      const th = mensajesState.find(x => x.id === threadId);
      if (th) {
        const now = new Date();
        const fechaStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        th.mensajes.push({
          remitente: 'maestro',
          autor: maestroState.nombre,
          texto: 'Enterado y recibido. He registrado la inasistencia como justificada en el sistema escolar.',
          fecha: fechaStr
        });
      }

      saveState();
      updateTeacherViews();
      showToast(`Falta de ${alumno.nombre} registrada como justificada`, "success");
    }

    async function handleTeacherSendReply(e) {
      e.preventDefault();
      const input = document.getElementById('teacher-reply-input');
      const text = input ? input.value.trim() : '';
      if (!text) return;

      const th = mensajesState.find(x => String(x.id) === String(selectedThreadId) || String(x.alumnoUuid) === String(selectedThreadId)) || mensajesState[0];
      if (!th) {
        showToast("Selecciona una conversación para responder", "error");
        return;
      }

      const id_alumno = th.alumnoUuid || th.id_alumno || th.id;
      const currentTeacherId = localStorage.getItem('currentTeacherId') || maestroState.id || 1;

      const payload = {
        id_alumno: id_alumno,
        id_maestro: currentTeacherId,
        asunto: 'Respuesta',
        texto: text,
        enviado_por: 'maestro'
      };

      const now = new Date();
      const fechaStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      th.mensajes.push({
        id: Date.now(),
        remitente: 'maestro',
        enviado_por: 'maestro',
        autor: maestroState.nombre || 'Prof. Carlos Mendoza',
        texto: text,
        fecha: fechaStr,
        asunto: 'Respuesta'
      });

      th.leidoPorMaestro = true;
      saveState();
      if (input) input.value = '';

      renderTeacherSelectedThread();
      renderTeacherMessagesThreads();

      try {
        const res = await fetch(`${API_BASE_URL}/mensajes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn("Backend error al enviar respuesta:", errData);
        }
      } catch (err) {
        console.warn("No se pudo conectar con el servidor para enviar respuesta:", err);
      }

      showToast("Respuesta enviada al padre de familia", "success");
    }

    function filterTeacherMessages() {
      const q = document.getElementById('search-messages-input').value;
      renderTeacherMessagesThreads(q);
    }

    function updateUnreadBadges() {
      const unreadCount = mensajesState.filter(m => !m.leidoPorMaestro).length;
      const badge = document.getElementById('sidebar-unread-badge');
      const dashCount = document.getElementById('dash-unread-count');

      if (dashCount) dashCount.textContent = unreadCount;

      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    }

    // Portal de Padres: Envío y Chat de Mensajes
    async function handleParentSendMessage(e) {
      e.preventDefault();
      if (!currentParentStudent) {
        showToast("No se ha seleccionado ningún alumno activo", "error");
        return;
      }

      const asunto = document.getElementById('p_msg_asunto')?.value || 'Aviso General';
      const input = document.getElementById('p_msg_texto');
      const texto = input ? input.value.trim() : '';
      if (!texto) return;

      const id_alumno = currentParentStudent.id || currentParentStudent.uuid;
      const currentTeacherId = localStorage.getItem('currentTeacherId') || currentParentStudent.id_maestro || maestroState.id || 1;

      const payload = {
        id_alumno: id_alumno,
        id_maestro: currentTeacherId,
        asunto: asunto,
        texto: texto,
        enviado_por: 'padre'
      };

      const now = new Date();
      const fechaStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      let thread = mensajesState.find(m => 
        m.alumnoUuid === currentParentStudent.uuid || 
        String(m.alumnoUuid) === String(currentParentStudent.id) ||
        m.id_alumno === currentParentStudent.uuid || 
        String(m.id_alumno) === String(currentParentStudent.id)
      );

      const nuevoMensaje = {
        id: Date.now(),
        id_alumno: id_alumno,
        id_maestro: currentTeacherId,
        remitente: 'padre',
        enviado_por: 'padre',
        autor: `${currentParentStudent.tutor || 'Tutor'} (Tutor)`,
        asunto: asunto,
        texto: texto,
        fecha: fechaStr
      };

      if (thread) {
        thread.leidoPorMaestro = false;
        thread.asunto = asunto;
        thread.mensajes.push(nuevoMensaje);
      } else {
        thread = {
          id: currentParentStudent.uuid || Date.now(),
          alumnoUuid: currentParentStudent.uuid || id_alumno,
          id_alumno: id_alumno,
          asunto: asunto,
          leidoPorMaestro: false,
          mensajes: [nuevoMensaje]
        };
        mensajesState.unshift(thread);
      }

      saveState();
      if (input) input.value = '';
      renderParentChatHistory(currentParentStudent.uuid);
      updateUnreadBadges();

      try {
        const res = await fetch(`${API_BASE_URL}/mensajes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn("Backend error al guardar mensaje:", errData);
        }
      } catch (err) {
        console.warn("No se pudo conectar con el servidor para guardar mensaje:", err);
      }

      showToast("Mensaje enviado al maestro con éxito", "success");
    }

    function renderParentChatHistory(studentUuid) {
      const container = document.getElementById('parent-chat-history');
      const studentThreads = mensajesState.filter(m => m.alumnoUuid === studentUuid);

      if (studentThreads.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80">Sin mensajes registrados. Usa el formulario superior para escribir al docente.</div>`;
        return;
      }

      container.innerHTML = studentThreads.map(th => `
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
            <span class="text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
              <i data-lucide="tag" class="w-3.5 h-3.5"></i>
              <span>${th.asunto}</span>
            </span>
            <span class="text-[10px] text-slate-500 dark:text-slate-300">${th.mensajes.length} interacción(es)</span>
          </div>

          <div class="space-y-2.5">
            ${th.mensajes.map(m => {
              const isParent = m.remitente === 'padre';
              return `
                <div class="flex flex-col ${isParent ? 'items-end' : 'items-start'}">
                  <div class="max-w-md ${isParent ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-xs' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs shadow-2xs'} p-3 text-xs space-y-1">
                    <div class="flex items-center justify-between gap-3 text-[10px] ${isParent ? 'text-indigo-200' : 'text-brand-600 dark:text-brand-400 font-bold'}">
                      <span>${m.autor}</span>
                      <span>${m.fecha}</span>
                    </div>
                    <p class="leading-relaxed whitespace-pre-wrap">${m.texto}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('');

      lucide.createIcons();
    }

    // ==========================================================
    // 8. CONFIGURACIÓN DE PERFIL Y REPORTE DE EVALUACIÓN
    // ==========================================================
    async function loadTeacherProfile() {
      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      if (!teacherId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/maestros/${teacherId}`);
        if (res.ok) {
          const maestro = await res.json();
          if (maestro) {
            if (maestro.nombre) maestroState.nombre = maestro.nombre;
            if (maestro.escuela) maestroState.colegio = maestro.escuela;
            if (maestro.ciclo_escolar) maestroState.ciclo = maestro.ciclo_escolar;
            if (maestro.grado_grupo) maestroState.grupo = maestro.grado_grupo;
            saveState();

            const nameEl = document.getElementById('config_nombre') || document.getElementById('config-teacher-name');
            if (nameEl && maestro.nombre) nameEl.value = maestro.nombre;

            const schoolEl = document.getElementById('config_colegio') || document.getElementById('config-school-name');
            if (schoolEl && maestro.escuela) schoolEl.value = maestro.escuela;

            const cycleEl = document.getElementById('config_ciclo') || document.getElementById('config-cycle');
            if (cycleEl && maestro.ciclo_escolar) cycleEl.value = maestro.ciclo_escolar;

            const groupEl = document.getElementById('config-grade-group');
            if (groupEl && maestro.grado_grupo) groupEl.value = maestro.grado_grupo;
          }
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
      }
    }

    async function handleUpdateProfile(event) {
      if (event) event.preventDefault();
      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      const nombre = (document.getElementById('config_nombre') || document.getElementById('config-teacher-name'))?.value?.trim();
      const correo = document.getElementById('config_correo')?.value?.trim();
      const escuela = (document.getElementById('config_colegio') || document.getElementById('config-school-name'))?.value?.trim();
      
      const gradoConfig = document.getElementById('config_grado_sel')?.value;
      const grupoConfig = document.getElementById('config_grupo_sel')?.value;
      let grado_grupo = (document.getElementById('config-grade-group'))?.value?.trim();
      if (gradoConfig && grupoConfig) {
        grado_grupo = `${gradoConfig} ${grupoConfig}`;
      }
      
      const ciclo_escolar = (document.getElementById('config_ciclo') || document.getElementById('config-cycle'))?.value?.trim();

      if (nombre) maestroState.nombre = nombre;
      if (correo) maestroState.correo = correo;
      if (escuela) maestroState.colegio = escuela;
      if (grado_grupo) maestroState.grupo = grado_grupo;
      if (ciclo_escolar) maestroState.ciclo = ciclo_escolar;

      const maxInput = document.getElementById('config_max_alumnos');
      if (maxInput) {
        const val = parseInt(maxInput.value, 10);
        if (!isNaN(val) && val > 0) {
          maestroState.maxAlumnos = val;
        }
      }

      saveState();
      updateTeacherViews();

      if (teacherId) {
        try {
          const res = await fetch(`${API_BASE_URL}/maestros/${teacherId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, escuela, grado_grupo, ciclo_escolar })
          });
          if (res.ok) {
            showToast('Perfil actualizado correctamente.', 'success');
            const sidebarGroup = document.querySelector('.sidebar-group-label');
            if (sidebarGroup && grado_grupo) sidebarGroup.textContent = grado_grupo;
          }
        } catch (err) {
          console.error('Error al guardar perfil:', err);
        }
      }
    }

    function handleSaveConfiguracion(e) {
      return handleUpdateProfile(e);
    }

    function handleTeacherPhotoUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast("Por favor selecciona un archivo de imagen válido", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          maestroState.foto = optimizedBase64;
          saveState();
          updateTeacherViews();
          showToast("Foto de perfil actualizada correctamente", "success");
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function handleRemoveTeacherPhoto() {
      if (!maestroState.foto) return;
      delete maestroState.foto;
      saveState();
      updateTeacherViews();
      showToast("Foto de perfil eliminada. Se usará tu inicial.", "info");
    }

    function updateTeacherViews() {
      document.getElementById('banner-teacher-name').textContent = maestroState.nombre;
      document.getElementById('banner-group-badge').textContent = maestroState.grupo;
      document.getElementById('sidebar-teacher-name').textContent = maestroState.nombre.split(' ')[0] + ' ' + (maestroState.nombre.split(' ')[1] || '');
      document.getElementById('sidebar-group-badge').textContent = maestroState.grupo;

      const initial = (maestroState.nombre || 'Carlos').trim().charAt(0).toUpperCase() || 'C';
      
      const sidebarAvatarContainer = document.getElementById('sidebar-avatar-container');
      if (sidebarAvatarContainer) {
        if (maestroState.foto) {
          sidebarAvatarContainer.innerHTML = `<img src="${maestroState.foto}" alt="Avatar" class="w-full h-full object-cover rounded-xl" />`;
        } else {
          sidebarAvatarContainer.innerHTML = `<span id="sidebar-avatar">${initial}</span>`;
        }
      } else {
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        if (sidebarAvatar) sidebarAvatar.textContent = initial;
      }

      const configAvatarPreview = document.getElementById('config-avatar-preview');
      const btnRemovePhoto = document.getElementById('btn-remove-teacher-photo');
      if (configAvatarPreview) {
        if (maestroState.foto) {
          configAvatarPreview.innerHTML = `<img src="${maestroState.foto}" alt="Foto Perfil" class="w-full h-full object-cover rounded-2xl" />`;
          if (btnRemovePhoto) btnRemovePhoto.classList.remove('hidden');
        } else {
          configAvatarPreview.innerHTML = `<span>${initial}</span>`;
          if (btnRemovePhoto) btnRemovePhoto.classList.add('hidden');
        }
      }

      const configNombre = document.getElementById('config_nombre');
      if(configNombre) configNombre.value = maestroState.nombre;
      const configCorreo = document.getElementById('config_correo');
      if(configCorreo) configCorreo.value = maestroState.correo;

      const { grado: currentGrado, grupo: currentGrupo } = parseGradoYGrupo(maestroState.grupo);
      const configGradoSel = document.getElementById('config_grado_sel');
      if (configGradoSel) configGradoSel.value = currentGrado;
      const configGrupoSel = document.getElementById('config_grupo_sel');
      if (configGrupoSel) configGrupoSel.value = currentGrupo;

      const configGrupo = document.getElementById('config_grupo');
      if(configGrupo) configGrupo.value = maestroState.grupo;
      const configColegio = document.getElementById('config_colegio');
      if(configColegio) configColegio.value = maestroState.colegio || 'Lumni';
      const configCiclo = document.getElementById('config_ciclo');
      if(configCiclo) configCiclo.value = maestroState.ciclo || '2026-2027';

      const maxAlumnos = getMaxAlumnos();
      const configMaxInput = document.getElementById('config_max_alumnos');
      if (configMaxInput) configMaxInput.value = maxAlumnos;

      const totalEnrolled = alumnosState.length;

      // Dashboard
      const dashCountCurrent = document.getElementById('dash-count-current');
      if (dashCountCurrent) dashCountCurrent.textContent = totalEnrolled;

      // Alumnos Tab
      const cupoMaxTab = document.getElementById('cupo-max-tab');
      if (cupoMaxTab) cupoMaxTab.textContent = totalEnrolled;

      const tablaTotalBadge = document.getElementById('tabla-total-badge');
      if (tablaTotalBadge) tablaTotalBadge.textContent = `${totalEnrolled} Alumnos Registrados`;

      // Sidebar Plan Docente
      const sidebarCapacidad = document.getElementById('sidebar-capacidad-txt');
      if (sidebarCapacidad) sidebarCapacidad.textContent = `$${SUSCRIPCION_MENSUAL} MXN/mes`;

      // Tarjeta de Suscripción en Configuración
      const cfgAlu = document.getElementById('config-alumnos-total');
      if (cfgAlu) cfgAlu.textContent = totalEnrolled;

      const subProximo = document.getElementById('sub-proximo-cobro');
      if (subProximo) subProximo.textContent = maestroState.suscripcion?.proximoPago || '01 de Octubre 2026';

      const presentes = alumnosState.filter(a => a.asistenciaHoy === 'presente').length;
      const rate = totalEnrolled > 0 ? Math.round((presentes / totalEnrolled) * 100) : 0;
      document.getElementById('dash-asistencia-rate').textContent = `${rate}%`;
      document.getElementById('dash-asistencia-count').textContent = `${presentes} de ${totalEnrolled}`;

      document.getElementById('dash-actividades-count').textContent = proyectosState.length + tareasState.length;
      document.getElementById('reportes-count-badge').textContent = `${reportesState.length} Reportes`;

      renderAlumnosTable();
      renderAttendanceTable();
      renderDynamicGradesTable();
      renderMateriasBadges();
      renderProjectsGrid();
      renderTareasGrid();
      renderTeacherMessagesThreads();
      renderReportesList();
      populateReportesSelect();
      renderDashboardActivity();
      renderTeacherAnunciosManagement();
      renderTeacherAnunciosList();
      renderAnunciosPadres();
      updateUnreadBadges();

      saveState();
      lucide.createIcons();
    }

    function sortGrades(col) {
      if (gradesSortCol === col) {
        gradesSortDir = gradesSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        gradesSortCol = col;
        gradesSortDir = 'asc';
      }
      renderDynamicGradesTable();
    }

    function renderDynamicGradesTable() {
      const thead = document.getElementById('dynamic-grades-thead');
      const tbody = document.getElementById('dynamic-grades-tbody');

      const getSortIcon = (col) => {
        if (gradesSortCol !== col) return '<i data-lucide="chevrons-up-down" class="w-3 h-3 inline-block ml-1 text-slate-400"></i>';
        return gradesSortDir === 'asc'
          ? '<i data-lucide="chevron-up" class="w-3 h-3 inline-block ml-1 text-brand-600"></i>'
          : '<i data-lucide="chevron-down" class="w-3 h-3 inline-block ml-1 text-brand-600"></i>';
      };

      let headersHtml = `<tr><th class="px-4 py-3 cursor-pointer select-none" onclick="sortGrades('nombre')">Alumno ${getSortIcon('nombre')}</th>`;
      materiasState.forEach(m => {
        headersHtml += `<th class="px-3 py-3 text-center cursor-pointer select-none" onclick="sortGrades('${m}')">${m} ${getSortIcon(m)}</th>`;
      });
      headersHtml += `<th class="px-4 py-3 text-center cursor-pointer select-none" onclick="sortGrades('promedio')">Promedio General ${getSortIcon('promedio')}</th>`;
      headersHtml += `<th class="px-3 py-3 text-right">Boleta</th></tr>`;
      thead.innerHTML = headersHtml;

      if (alumnosState.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${materiasState.length + 3}" class="px-4 py-8"><div class="flex flex-col items-center justify-center gap-2 text-slate-400"><i data-lucide="award" class="w-8 h-8 text-slate-300"></i><p class="text-sm font-semibold text-slate-500">Sin alumnos para evaluar</p></div></td></tr>`;
        return;
      }

      let data = [...alumnosState];
      if (gradesSortCol) {
        data.sort((a, b) => {
          let valA, valB;
          if (gradesSortCol === 'nombre') {
            valA = a.nombre.toLowerCase();
            valB = b.nombre.toLowerCase();
          } else if (gradesSortCol === 'promedio') {
            const getProm = (al) => {
              let s = 0, c = 0;
              materiasState.forEach(m => {
                if (al.calificaciones?.[m] !== undefined && al.calificaciones?.[m] !== null) {
                  s += parseFloat(al.calificaciones[m]) || 0;
                  c++;
                }
              });
              return c > 0 ? s / c : 0;
            };
            valA = getProm(a);
            valB = getProm(b);
          } else {
            valA = a.calificaciones?.[gradesSortCol] !== undefined ? parseFloat(a.calificaciones[gradesSortCol]) : -1;
            valB = b.calificaciones?.[gradesSortCol] !== undefined ? parseFloat(b.calificaciones[gradesSortCol]) : -1;
          }

          if (valA < valB) return gradesSortDir === 'asc' ? -1 : 1;
          if (valA > valB) return gradesSortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }

      tbody.innerHTML = data.map((alumno) => {
        const aIdx = alumnosState.findIndex(x => x.uuid === alumno.uuid);
        if (!alumno.calificaciones) alumno.calificaciones = {};
        let rowHtml = `<tr class="hover:bg-slate-50 dark:bg-slate-800 transition-colors">
          <td class="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">${alumno.nombre}</td>`;

        let sum = 0, count = 0;
        materiasState.forEach(m => {
          const hasVal = alumno.calificaciones && alumno.calificaciones[m] !== undefined && alumno.calificaciones[m] !== null && alumno.calificaciones[m] !== '';
          const val = hasVal ? Math.round(parseFloat(alumno.calificaciones[m]) || 0) : '';
          if (hasVal) {
            sum += val;
            count++;
          }

          rowHtml += `
            <td class="px-3 py-2 text-center">
              <input
                type="number"
                step="1"
                min="0"
                max="10"
                placeholder="-"
                value="${val}"
                oninput="updateDynamicGrade(${aIdx}, '${m}', this.value)"
                class="w-16 text-center py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </td>
          `;
        });

        const avgDecimal = count > 0 ? (sum / count).toFixed(1) : '-';
        rowHtml += `
          <td class="px-4 py-3 text-center font-extrabold text-brand-600 dark:text-brand-400 text-sm font-mono" id="prom-alumno-${aIdx}">
            ${avgDecimal}
          </td>
          <td class="px-3 py-3 text-right">
            <button onclick="openBoletaModal('${alumno.uuid}')" class="px-2 py-1 bg-brand-50 dark:bg-brand-900/40 hover:bg-brand-100 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
              <span>Boleta</span>
            </button>
          </td>
        </tr>`;

        return rowHtml;
      }).join('');
    }

    function updateDynamicGrade(alumnoIdx, materia, value) {
      const alumno = alumnosState[alumnoIdx];
      if (!alumno) return;
      if (!alumno.calificaciones) alumno.calificaciones = {};
      
      const trimmed = String(value).trim();
      if (trimmed === '') {
        delete alumno.calificaciones[materia];
      } else {
        let intVal = parseInt(trimmed, 10);
        if (isNaN(intVal)) intVal = 0;
        if (intVal > 10) intVal = 10;
        if (intVal < 0) intVal = 0;
        alumno.calificaciones[materia] = intVal;
      }

      let sum = 0, count = 0;
      materiasState.forEach(m => {
        if (alumno.calificaciones[m] !== undefined && alumno.calificaciones[m] !== null) {
          sum += (parseInt(alumno.calificaciones[m], 10) || 0);
          count++;
        }
      });
      const avgDecimal = count > 0 ? (sum / count).toFixed(1) : '-';
      const el = document.getElementById(`prom-alumno-${alumnoIdx}`);
      if (el) el.textContent = avgDecimal;

      saveState();
    }

    async function saveAllGrades() {
      saveState();
      showToast("¡Reporte de Evaluación guardado exitosamente!", "success");

      // Sincronizar calificaciones con backend
      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      if (teacherId && alumnosState.length > 0) {
        for (const alumno of alumnosState) {
          const studentId = alumno.id || alumno.uuid;
          if (!studentId || !alumno.calificaciones) continue;
          for (const mat of Object.keys(alumno.calificaciones)) {
            const cal = alumno.calificaciones[mat];
            if (cal !== undefined && cal !== null && cal !== '') {
              fetch(`${API_BASE_URL}/calificaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_alumno: studentId,
                  id_maestro: teacherId,
                  materia: mat,
                  calificacion: cal
                })
              }).catch(() => {});
            }
          }
        }
      }
    }

    function openMateriasModal() {
      renderMateriasModalList();
      document.getElementById('modal-materias').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeMateriasModal() {
      document.getElementById('modal-materias').classList.add('hidden');
    }

    function renderMateriasModalList() {
      const container = document.getElementById('materias-modal-list');
      if (materiasState.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 p-4 text-center">No hay materias configuradas.</p>`;
        return;
      }
      container.innerHTML = materiasState.map((mat, idx) => `
        <div class="p-3 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-800 transition-colors">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">${idx + 1}</span>
            <span class="font-bold text-xs text-slate-800 dark:text-slate-200">${mat}</span>
          </div>
          <button onclick="deleteMateria(${idx})" class="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer" title="Eliminar">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `).join('');
    }

    function handleAddMateria(e) {
      e.preventDefault();
      const input = document.getElementById('new-materia-name');
      const val = input.value.trim();
      if (!val) return;

      if (materiasState.includes(val)) {
        showToast("Esa materia ya existe.", "error");
        return;
      }

      materiasState.push(val);
      alumnosState.forEach(a => {
        if (!a.calificaciones) a.calificaciones = {};
        if (!a.calificaciones[val]) a.calificaciones[val] = 9.0;
      });

      input.value = '';
      renderMateriasModalList();
      updateTeacherViews();
      showToast(`Materia "${val}" agregada`, "success");
    }

    function deleteMateria(index) {
      const mat = materiasState[index];
      if (materiasState.length <= 1) {
        showToast("Debe haber al menos 1 materia.", "error");
        return;
      }

      materiasState.splice(index, 1);
      alumnosState.forEach(a => {
        if (a.calificaciones && a.calificaciones[mat]) delete a.calificaciones[mat];
      });

      renderMateriasModalList();
      updateTeacherViews();
      showToast(`Materia "${mat}" eliminada`, "info");
    }

    function renderMateriasBadges() {
      const container = document.getElementById('active-materias-badges');
      container.innerHTML = materiasState.map(m => `
        <span class="px-2.5 py-1 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-lg font-bold text-xs border border-brand-100 flex items-center gap-1">
          <i data-lucide="book" class="w-3 h-3"></i>
          <span>${m}</span>
        </span>
      `).join('');
    }

    // ==========================================================
    // 9. PROYECTOS & TAREAS
    // ==========================================================

    // Obtener campos formativos seleccionados en cualquier modal
    function getSelectedCamposFormativos(containerSelector) {
      const container = document.querySelector(containerSelector);
      if (!container) return [];
      
      const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
      return Array.from(checkboxes).map(cb => cb.value || cb.nextElementSibling?.textContent?.trim()).filter(Boolean);
    }

    function closeModal(modalId) {
      const el = document.getElementById(modalId) || document.getElementById(modalId.replace('nueva', 'new').replace('nuevo', 'new'));
      if (el) el.classList.add('hidden');
    }

    function openNewProjectModal() {
      document.getElementById('modal-new-project')?.classList.remove('hidden');
      lucide.createIcons();
    }

    function closeNewProjectModal() {
      closeModal('modal-new-project');
    }

    // Crear nuevo proyecto desde el modal
    async function handleCreateProject(event) {
      if (event) event.preventDefault();

      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      const titulo = (document.getElementById('project-title') || document.getElementById('proj-title'))?.value?.trim();
      const fechaPublicacion = (document.getElementById('project-publish-date') || document.getElementById('proj-pub-date'))?.value || new Date().toISOString().split('T')[0];
      const fechaEntrega = (document.getElementById('project-due-date') || document.getElementById('proj-date'))?.value;
      const instrucciones = (document.getElementById('project-rubric') || document.getElementById('proj-desc'))?.value?.trim();
      const camposFormativos = getSelectedCamposFormativos('#modal-new-project') || getSelectedCamposFormativos('#modal-nuevo-proyecto');

      if (!teacherId || !titulo || !fechaEntrega) {
        showToast('Por favor completa el título y la fecha de entrega del proyecto.', 'error');
        return;
      }

      if (camposFormativos.length === 0) {
        showToast('Selecciona al menos un Campo Formativo.', 'error');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/proyectos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_maestro: teacherId,
            titulo,
            campos_formativos: camposFormativos,
            fecha_publicacion: fechaPublicacion,
            fecha_entrega: fechaEntrega,
            instrucciones
          })
        });

        if (res.ok) {
          closeModal('modal-new-project');
          closeModal('modal-nuevo-proyecto');
          document.getElementById('form-new-project')?.reset();
          showToast('Proyecto publicado con éxito', 'success');
          loadTeacherProjects(teacherId);
        } else {
          console.error('Error al guardar el proyecto');
        }
      } catch (err) {
        console.error('Error de red al crear proyecto:', err);
      }
    }

    function renderProjectsList(proyectos) {
      renderProjectsGrid(proyectos);
    }

    function renderProjectsGrid(customProjects = null) {
      const container = document.getElementById('projects-grid');
      if (!container) return;
      const list = customProjects !== null ? customProjects : proyectosState;

      if (!list || list.length === 0) {
        container.innerHTML = `<div class="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-8 flex flex-col items-center justify-center gap-3"><i data-lucide="folder-kanban" class="w-10 h-10 text-slate-300"></i><div class="text-center"><p class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay proyectos activos</p><p class="text-[11px] text-slate-400">Planifica el primer proyecto integrador.</p></div></div>`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = list.map((proj, idx) => {
        const camposList = proj.campos_formativos || proj.campos || [];
        const camposBadges = camposList.map(c => `
          <span class="text-[9px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded-md border border-brand-100">${c}</span>
        `).join(' ');

        const pubDate = proj.fecha_publicacion || proj.fechaPub;
        const dueDate = proj.fecha_entrega || proj.fecha;
        const pubText = pubDate ? `Pub: ${pubDate}` : 'Publicado';
        const isPendingReview = dueDate ? (new Date(dueDate) < new Date()) : false;
        const pendingBadge = isPendingReview ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400">Revisión Pendiente</span>` : '';

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4 relative">
            <div>
              <div class="flex flex-wrap gap-1 mb-2">${camposBadges}</div>
              <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">${proj.titulo}</h3>
              <p class="text-[10px] text-slate-400 mb-1">${pubText}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${proj.instrucciones || proj.desc || ''}</p>
            </div>
            <div class="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <span>Entrega: <strong class="text-slate-700 dark:text-slate-300">${dueDate || 'Sin fecha'}</strong></span>
                ${pendingBadge}
              </div>
              <button onclick="deleteProject(${idx})" class="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
      lucide.createIcons();
    }

    async function deleteProject(index) {
      const proj = proyectosState[index];
      if (!proj) return;
      if (!confirm("¿Deseas eliminar este proyecto escolar?")) return;

      const projId = proj.id;
      proyectosState.splice(index, 1);
      saveState();
      updateTeacherViews();
      showToast("Proyecto eliminado", "info");

      if (projId && typeof projId === 'string' && projId.length > 10) {
        try {
          await fetch(`${API_BASE_URL}/proyectos/${projId}`, { method: 'DELETE' });
        } catch (err) {
          console.warn("Error al borrar proyecto en backend:", err);
        }
      }
    }

    function openNewTareaModal() {
      document.getElementById('modal-new-tarea')?.classList.remove('hidden');
      lucide.createIcons();
    }

    function closeNewTareaModal() {
      closeModal('modal-new-tarea');
    }

    // Crear nueva tarea desde el modal
    async function handleCreateTask(event) {
      if (event) event.preventDefault();
      
      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      const titulo = (document.getElementById('task-title') || document.getElementById('tarea-title'))?.value?.trim();
      const fechaPublicacion = (document.getElementById('task-publish-date') || document.getElementById('tarea-pub-date'))?.value || new Date().toISOString().split('T')[0];
      const fechaEntrega = (document.getElementById('task-due-date') || document.getElementById('tarea-date'))?.value;
      const instrucciones = (document.getElementById('task-instructions') || document.getElementById('tarea-desc'))?.value?.trim();
      const camposFormativos = getSelectedCamposFormativos('#modal-new-tarea') || getSelectedCamposFormativos('#modal-nueva-tarea');

      if (!teacherId || !titulo || !fechaEntrega) {
        showToast('Por favor completa el título y la fecha de entrega.', 'error');
        return;
      }

      if (camposFormativos.length === 0) {
        showToast('Selecciona al menos un Campo Formativo.', 'error');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/tareas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_maestro: teacherId,
            titulo,
            campos_formativos: camposFormativos,
            fecha_publicacion: fechaPublicacion,
            fecha_entrega: fechaEntrega,
            instrucciones
          })
        });

        if (res.ok) {
          closeModal('modal-new-tarea');
          closeModal('modal-nueva-tarea');
          document.getElementById('form-new-tarea')?.reset();
          showToast('Tarea asignada para casa', 'success');
          loadTeacherTasks(teacherId);
        } else {
          console.error('Error al guardar la tarea');
        }
      } catch (err) {
        console.error('Error de red al crear tarea:', err);
      }
    }

    function handleCreateTarea(event) {
      return handleCreateTask(event);
    }

    function renderTasksList(tareas) {
      renderTareasGrid(tareas);
    }

    function renderTareasGrid(customTasks = null) {
      const container = document.getElementById('tareas-grid');
      if (!container) return;
      const list = customTasks !== null ? customTasks : tareasState;

      if (!list || list.length === 0) {
        container.innerHTML = `<div class="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-8 flex flex-col items-center justify-center gap-3"><i data-lucide="check-square" class="w-10 h-10 text-slate-300"></i><div class="text-center"><p class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay tareas asignadas</p><p class="text-[11px] text-slate-400">Crea la primera tarea escolar.</p></div></div>`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = list.map((tarea, idx) => {
        const camposList = tarea.campos_formativos || tarea.campos || [];
        const camposBadges = camposList.map(c => `
          <span class="text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md border border-indigo-100">${c}</span>
        `).join(' ');

        const pubDate = tarea.fecha_publicacion || tarea.fechaPub;
        const dueDate = tarea.fecha_entrega || tarea.fecha;
        const pubText = pubDate ? `Pub: ${pubDate}` : 'Publicado';
        const isPendingReview = dueDate ? (new Date(dueDate) < new Date()) : false;
        const pendingBadge = isPendingReview ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400">Revisión Pendiente</span>` : '';

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4 relative">
            <div>
              <div class="flex flex-wrap gap-1 mb-2">${camposBadges}</div>
              <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">${tarea.titulo}</h3>
              <p class="text-[10px] text-slate-400 mb-1">${pubText}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${tarea.instrucciones || tarea.desc || ''}</p>
            </div>
            <div class="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <span>Entrega: <strong class="text-slate-700 dark:text-slate-300">${dueDate || 'Sin fecha'}</strong></span>
                ${pendingBadge}
              </div>
              <button onclick="deleteTarea(${idx})" class="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
      lucide.createIcons();
    }

    async function deleteTarea(index) {
      const t = tareasState[index];
      if (!t) return;
      if (!confirm("¿Deseas eliminar esta tarea escolar?")) return;

      const tareaId = t.id;
      tareasState.splice(index, 1);
      saveState();
      updateTeacherViews();
      showToast("Tarea eliminada", "info");

      if (tareaId && typeof tareaId === 'string' && tareaId.length > 10) {
        try {
          await fetch(`${API_BASE_URL}/tareas/${tareaId}`, { method: 'DELETE' });
        } catch (err) {
          console.warn("Error al borrar tarea en backend:", err);
        }
      }
    }

    // ==========================================================
    // 9.5 CALENDARIO ESCOLAR
    // ==========================================================
    async function loadTeacherCalendar(teacherId) {
      const id = teacherId || localStorage.getItem('currentTeacherId') || maestroState.id;
      if (!id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/calendario/maestro/${id}`);
        if (res.ok) {
          const eventos = await res.json();
          if (Array.isArray(eventos)) {
            calendarioEventsState = eventos;
            localStorage.setItem('lumni_calendario', JSON.stringify(calendarioEventsState));
          }
          renderCalendarEvents(calendarioEventsState);
        }
      } catch (err) {
        console.error('Error cargando calendario:', err);
      }
    }

    function renderCalendarEvents(eventos) {
      renderCalendario('teacher-calendar-grid');
    }

    async function handleCreateCalendarEvent(event) {
      if (event) event.preventDefault();
      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      const titulo = (document.getElementById('event-title') || document.getElementById('evento-title'))?.value?.trim();
      let tipo = (document.getElementById('event-type') || document.getElementById('evento-type'))?.value || 'evento';
      const fecha = (document.getElementById('event-date') || document.getElementById('evento-date'))?.value;
      const descripcion = (document.getElementById('event-desc') || document.getElementById('evento-desc'))?.value?.trim();

      if (!teacherId || !titulo || !fecha) {
        showToast('Completa los campos obligatorios (título y fecha).', 'error');
        return;
      }

      const validTypes = ['evento', 'entrega', 'evaluacion'];
      if (!validTypes.includes(tipo)) {
        tipo = 'evento';
      }

      try {
        const res = await fetch(`${API_BASE_URL}/calendario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_maestro: teacherId, titulo, tipo, fecha, descripcion: descripcion || '' })
        });
        if (res.ok) {
          closeModal('modal-nuevo-evento');
          closeModal('modal-new-evento');
          document.getElementById('form-nuevo-evento')?.reset();
          showToast('Evento agendado con éxito', 'success');
          loadTeacherCalendar(teacherId);
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Error al guardar evento', 'error');
        }
      } catch (err) {
        console.error('Error al guardar evento:', err);
      }
    }

    function renderCalendario(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      // Actualizar el título del mes en la UI si existe
      const titleEl = document.getElementById(`${containerId}-title`);
      if(titleEl) titleEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

      let html = '';
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      // Cabeceras de los días
      html += `<div class="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 dark:text-slate-400 mb-2">`;
      dayNames.forEach(d => html += `<div>${d}</div>`);
      html += `</div>`;

      html += `<div class="grid grid-cols-7 gap-1">`;

      // Celdas vacías
      for (let i = 0; i < firstDay; i++) {
        html += `<div class="p-2 border border-transparent"></div>`;
      }

      // Días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        let eventsHtml = '';

        // Buscar eventos de la base de datos de calendario
        const dayCalendarEvents = (calendarioEventsState || []).filter(e => e.fecha === dateStr);
        dayCalendarEvents.forEach(e => {
          const badgeClass = e.tipo === 'evaluacion' 
            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            : (e.tipo === 'entrega' 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60');
          eventsHtml += `<div class="text-[9px] ${badgeClass} p-0.5 rounded mb-0.5 truncate border" title="Evento: ${e.titulo}">${e.titulo}</div>`;
        });

        // Buscar eventos para este día
        const dayProjects = proyectosState.filter(p => p.fecha === dateStr);
        dayProjects.forEach(p => {
          eventsHtml += `<div class="text-[9px] bg-brand-100 text-brand-800 p-0.5 rounded mb-0.5 truncate border border-brand-200" title="Proyecto: ${p.titulo}">P: ${p.titulo}</div>`;
        });

        const dayTareas = tareasState.filter(t => t.fecha === dateStr);
        dayTareas.forEach(t => {
          eventsHtml += `<div class="text-[9px] bg-indigo-100 text-indigo-800 p-0.5 rounded mb-0.5 truncate border border-indigo-200" title="Tarea: ${t.titulo}">T: ${t.titulo}</div>`;
        });

        const dayAnuncios = anunciosState.filter(a => a.fecha === dateStr);
        dayAnuncios.forEach(a => {
          eventsHtml += `<div class="text-[9px] bg-amber-100 text-amber-800 p-0.5 rounded mb-0.5 truncate border border-amber-200" title="Aviso: ${a.titulo}">A: ${a.titulo}</div>`;
        });

        const isToday = day === today.getDate();
        const classes = isToday
          ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-700 font-bold'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50';

        html += `
          <div class="p-1 min-h-[60px] border rounded-lg ${classes} flex flex-col">
            <span class="text-[10px] text-right mb-1 text-slate-700 dark:text-slate-300 ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}">${day}</span>
            <div class="flex-1 overflow-y-auto max-h-[50px] custom-scrollbar">
              ${eventsHtml}
            </div>
          </div>
        `;
      }

      html += `</div>`;
      container.innerHTML = html;
      lucide.createIcons();
    }

    // ==========================================================
    // 9.6 ANUNCIOS Y CIRCULARES ESCOLARES (DOCENTE & FAMILIAS)
    // ==========================================================
    let currentAnuncioCategoryFilter = 'todas';
    let currentAnuncioSearchQuery = '';

    let rawAnuncios = JSON.parse(localStorage.getItem('lumni_anuncios'));
    let anunciosState = (rawAnuncios && Array.isArray(rawAnuncios))
      ? rawAnuncios.map((a, idx) => ({
          id: a.id || (Date.now() - (idx * 1000)),
          fecha: a.fecha || new Date().toISOString().split('T')[0],
          titulo: a.titulo || 'Comunicado Escolar',
          categoria: a.categoria || 'General',
          prioridad: a.prioridad || (a.titulo?.toLowerCase().includes('urgente') ? 'Alta' : 'Normal'),
          fijado: Boolean(a.fijado),
          autor: a.autor || maestroState?.nombre || 'Docente Titular',
          desc: a.desc || a.contenido || '',
          contenido: a.contenido || a.desc || ''
        }))
      : [];

    function getAnuncioCategoryMeta(cat) {
      const meta = {
        'Urgente': {
          label: 'Urgente / Importante',
          icon: 'alert-circle',
          badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
          parentBadgeClass: 'bg-rose-500/30 text-rose-100 border border-rose-400/40'
        },
        'Reunión': {
          label: 'Reunión de Padres',
          icon: 'users',
          badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
          parentBadgeClass: 'bg-amber-500/30 text-amber-100 border border-amber-400/40'
        },
        'Evento': {
          label: 'Evento Escolar',
          icon: 'party-popper',
          badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
          parentBadgeClass: 'bg-purple-500/30 text-purple-100 border border-purple-400/40'
        },
        'Académico': {
          label: 'Académico & Tareas',
          icon: 'book-open',
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
          parentBadgeClass: 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
        },
        'General': {
          label: 'General',
          icon: 'megaphone',
          badgeClass: 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60',
          parentBadgeClass: 'bg-white/20 text-white border border-white/30'
        }
      };
      return meta[cat] || meta['General'];
    }

    function filterTeacherAnuncios(cat) {
      currentAnuncioCategoryFilter = cat;
      const buttons = document.querySelectorAll('#anuncios-categories-filter .anuncio-filter-btn');
      buttons.forEach(btn => {
        const btnCat = btn.getAttribute('data-cat');
        if (btnCat === cat) {
          btn.className = "anuncio-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-brand-600 text-white shadow-xs";
        } else {
          btn.className = "anuncio-filter-btn px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
        }
      });
      renderTeacherAnunciosManagement();
    }

    function handleSearchAnuncios(e) {
      currentAnuncioSearchQuery = (e.target.value || '').trim().toLowerCase();
      renderTeacherAnunciosManagement();
    }

    function renderTeacherAnunciosManagement() {
      const container = document.getElementById('teacher-anuncios-grid');
      if (!container) return;

      const totalEl = document.getElementById('anuncios-stat-total');
      if (totalEl) totalEl.textContent = anunciosState.length;

      const urgentesCount = anunciosState.filter(a => a.fijado || a.prioridad === 'Alta' || a.categoria === 'Urgente').length;
      const urgentesEl = document.getElementById('anuncios-stat-urgentes');
      if (urgentesEl) urgentesEl.textContent = urgentesCount;

      const alcanceEl = document.getElementById('anuncios-stat-alcance');
      if (alcanceEl) {
        const aluCount = alumnosState.length;
        alcanceEl.textContent = `${aluCount} Alumnos (${aluCount} Familias)`;
      }

      const sidebarBadge = document.getElementById('sidebar-anuncios-badge');
      if (sidebarBadge) {
        if (anunciosState.length > 0) {
          sidebarBadge.textContent = anunciosState.length;
          sidebarBadge.classList.remove('hidden');
        } else {
          sidebarBadge.classList.add('hidden');
        }
      }

      let filtered = [...anunciosState];
      if (currentAnuncioCategoryFilter !== 'todas') {
        filtered = filtered.filter(a => a.categoria === currentAnuncioCategoryFilter);
      }
      if (currentAnuncioSearchQuery) {
        filtered = filtered.filter(a => 
          (a.titulo || '').toLowerCase().includes(currentAnuncioSearchQuery) ||
          (a.desc || '').toLowerCase().includes(currentAnuncioSearchQuery) ||
          (a.categoria || '').toLowerCase().includes(currentAnuncioSearchQuery)
        );
      }

      // Ordenar: Fijados primero, luego por fecha descendente
      filtered.sort((a, b) => {
        if (a.fijado && !b.fijado) return -1;
        if (!a.fijado && b.fijado) return 1;
        return new Date(b.fecha) - new Date(a.fecha);
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-8 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <i data-lucide="megaphone" class="w-6 h-6"></i>
            </div>
            <p class="text-sm font-bold text-slate-800 dark:text-slate-200">No se encontraron avisos escolares</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              ${currentAnuncioSearchQuery || currentAnuncioCategoryFilter !== 'todas'
                ? 'Prueba cambiando los filtros de búsqueda o categoría.'
                : 'Aún no has publicado ningún aviso para las familias. Haz clic en "Publicar Nuevo Aviso" para comenzar.'}
            </p>
            <button onclick="openNewAnuncioModal()" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Publicar Aviso Ahora</span>
            </button>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      container.innerHTML = filtered.map(a => {
        const meta = getAnuncioCategoryMeta(a.categoria);
        const isUrgent = a.prioridad === 'Alta' || a.categoria === 'Urgente';
        const isPinned = Boolean(a.fijado);

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl border ${isPinned ? 'border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-400/20' : 'border-slate-200 dark:border-slate-700/80'} p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            
            <div class="space-y-3">
              <!-- Top bar con Badges y Pin -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${meta.badgeClass}">
                    <i data-lucide="${meta.icon}" class="w-3 h-3"></i>
                    <span>${a.categoria}</span>
                  </span>

                  ${isUrgent ? `
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                      <i data-lucide="alert-triangle" class="w-3 h-3 text-rose-600 animate-pulse"></i>
                      <span>Urgente</span>
                    </span>
                  ` : ''}

                  ${isPinned ? `
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                      <i data-lucide="pin" class="w-3 h-3 text-amber-600"></i>
                      <span>Fijado</span>
                    </span>
                  ` : ''}
                </div>

                <span class="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <i data-lucide="calendar" class="w-3 h-3"></i>
                  <span>${a.fecha}</span>
                </span>
              </div>

              <!-- Título y Descripción -->
              <div>
                <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">${a.titulo}</h3>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-line">${a.desc}</p>
              </div>
            </div>

            <!-- Footer con Autor y Botones de Acción -->
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <i data-lucide="user-check" class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400"></i>
                <span>${a.autor || maestroState?.nombre || 'Docente'}</span>
              </div>

              <div class="flex items-center gap-1.5 self-end sm:self-auto">
                <button onclick="copyAnuncioWhatsApp('${a.id}')" class="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all border border-emerald-200 dark:border-emerald-800/60 cursor-pointer" title="Copiar para enviar a grupo de WhatsApp">
                  <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                  <span>WhatsApp</span>
                </button>

                <button onclick="togglePinAnuncio('${a.id}')" class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer" title="${isPinned ? 'Desfijar aviso' : 'Fijar al inicio'}">
                  <i data-lucide="pin" class="w-3.5 h-3.5 ${isPinned ? 'text-amber-500 fill-amber-500' : ''}"></i>
                </button>

                <button onclick="openEditAnuncioModal('${a.id}')" class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer" title="Editar comunicado">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                </button>

                <button onclick="deleteAnuncioById('${a.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer" title="Eliminar aviso">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

          </div>
        `;
      }).join('');

      lucide.createIcons();
    }

    function renderTeacherAnunciosList() {
      const container = document.getElementById('dash-anuncios-list');
      if (!container) return;

      if (anunciosState.length === 0) {
        container.innerHTML = `<p class="text-slate-400 py-6 text-center text-xs">No hay avisos publicados. Publica uno con el botón "+ Nuevo Aviso".</p>`;
        return;
      }

      const preview = [...anunciosState]
        .sort((a, b) => (b.fijado ? 1 : 0) - (a.fijado ? 1 : 0) || new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 3);

      container.innerHTML = preview.map(a => {
        const meta = getAnuncioCategoryMeta(a.categoria);
        return `
          <div class="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700/80 space-y-1.5 transition-all">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 overflow-hidden">
                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${meta.badgeClass}">
                  ${a.categoria}
                </span>
                <h4 class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">${a.titulo}</h4>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-[10px] text-slate-400 font-medium">${a.fecha}</span>
                <button onclick="deleteAnuncioById('${a.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer" title="Eliminar aviso" aria-label="Eliminar aviso">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </div>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">${a.desc}</p>
          </div>
        `;
      }).join('');
      lucide.createIcons();
    }

    function renderParentAnnouncements(customList = null) {
      const container = document.getElementById('p-anuncios-list');
      const badge = document.getElementById('p-anuncios-count-badge');
      if (!container) return;

      const list = customList !== null ? customList : anunciosState;

      if (badge) {
        badge.textContent = `${list.length} comunicado${list.length === 1 ? '' : 's'}`;
      }

      if (list.length === 0) {
        container.innerHTML = `
          <div class="bg-white/10 rounded-2xl p-4 border border-white/20 text-center text-xs text-white/80">
            No hay avisos escolares publicados por el docente titular en este momento.
          </div>
        `;
        return;
      }

      const sorted = [...list].sort((a, b) => {
        if (a.fijado && !b.fijado) return -1;
        if (!a.fijado && b.fijado) return 1;
        return new Date(b.fecha) - new Date(a.fecha);
      });

      container.innerHTML = sorted.map(a => {
        const meta = getAnuncioCategoryMeta(a.categoria);
        const isUrgent = a.prioridad === 'Alta' || a.categoria === 'Urgente';
        const isPinned = Boolean(a.fijado);

        return `
          <div class="bg-white/10 hover:bg-white/15 rounded-2xl p-4 border border-white/25 backdrop-blur-xs space-y-2.5 transition-all text-white shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${meta.parentBadgeClass}">
                  <i data-lucide="${meta.icon}" class="w-3 h-3"></i>
                  <span>${a.categoria}</span>
                </span>
                ${isUrgent ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                    <i data-lucide="alert-triangle" class="w-3 h-3"></i>
                    <span>URGENTE</span>
                  </span>
                ` : ''}
                ${isPinned ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
                    <i data-lucide="pin" class="w-3 h-3"></i>
                    <span>Fijado</span>
                  </span>
                ` : ''}
              </div>

              <span class="text-[11px] text-white/80 font-medium flex items-center gap-1">
                <i data-lucide="calendar" class="w-3 h-3"></i>
                <span>${a.fecha}</span>
              </span>
            </div>

            <div>
              <h4 class="font-extrabold text-sm sm:text-base text-white tracking-wide">${a.titulo}</h4>
              <p class="text-xs sm:text-sm text-white/95 mt-1 leading-relaxed whitespace-pre-line">${a.desc || a.contenido || ''}</p>
            </div>

            <div class="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/75">
              <span>Emitido por: <strong class="text-white font-semibold">${a.autor || (currentParentStudent?.maestro?.nombre) || maestroState?.nombre || 'Docente Titular'}</strong></span>
              <button onclick="copyAnuncioWhatsApp('${a.id}')" class="text-amber-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors" title="Compartir mensaje">
                <i data-lucide="share-2" class="w-3 h-3"></i>
                <span>Compartir</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
      lucide.createIcons();
    }

    function renderAnunciosPadres(customList = null) {
      renderParentAnnouncements(customList);
    }

    function openNewAnuncioModal(editId = null) {
      const editInput = document.getElementById('anuncio-edit-id');
      const headerTitle = document.getElementById('modal-anuncio-header-title');
      const submitTxt = document.getElementById('btn-submit-anuncio-txt');
      const tituloInput = document.getElementById('anuncio-titulo');
      const catInput = document.getElementById('anuncio-categoria');
      const dateInput = document.getElementById('anuncio-fecha');
      const descInput = document.getElementById('anuncio-desc');
      const fijadoInput = document.getElementById('anuncio-fijado');

      if (editId) {
        const anuncio = anunciosState.find(a => String(a.id) === String(editId));
        if (anuncio) {
          if (editInput) editInput.value = anuncio.id;
          if (headerTitle) headerTitle.textContent = "Editar Comunicado Escolar";
          if (submitTxt) submitTxt.textContent = "Guardar Cambios";
          if (tituloInput) tituloInput.value = anuncio.titulo;
          if (catInput) catInput.value = anuncio.categoria;
          if (dateInput) dateInput.value = anuncio.fecha;
          if (descInput) descInput.value = anuncio.desc;
          if (fijadoInput) fijadoInput.checked = Boolean(anuncio.fijado);
        }
      } else {
        if (editInput) editInput.value = "";
        if (headerTitle) headerTitle.textContent = "Publicar Aviso / Circular para Familias";
        if (submitTxt) submitTxt.textContent = "Publicar Aviso";
        if (tituloInput) tituloInput.value = "";
        if (catInput) catInput.value = "General";
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (descInput) descInput.value = "";
        if (fijadoInput) fijadoInput.checked = false;
      }

      document.getElementById('modal-new-anuncio').classList.remove('hidden');
      lucide.createIcons();
    }

    function openEditAnuncioModal(id) {
      openNewAnuncioModal(id);
    }

    function closeNewAnuncioModal() {
      document.getElementById('modal-new-anuncio').classList.add('hidden');
      document.getElementById('form-new-anuncio')?.reset();
    }

    // Crear Anuncio en Backend
    async function handleCreateAnnouncement(titulo, contenido, extraData = {}) {
      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      if (!teacherId || !contenido.trim()) return;

      try {
        const res = await fetch(`${API_BASE_URL}/anuncios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_maestro: teacherId,
            titulo: titulo || 'Comunicado Escolar',
            contenido: contenido.trim(),
            ...extraData
          })
        });

        if (res.ok) {
          await loadTeacherAnnouncements(teacherId);
        } else {
          console.error('Error al publicar anuncio en el servidor');
        }
      } catch (err) {
        console.error('Error al enviar anuncio:', err);
      }
    }

    async function handleCreateOrUpdateAnuncio(e) {
      e.preventDefault();
      const editId = document.getElementById('anuncio-edit-id')?.value;
      const titulo = document.getElementById('anuncio-titulo').value.trim();
      const categoria = document.getElementById('anuncio-categoria').value;
      const fecha = document.getElementById('anuncio-fecha').value || new Date().toISOString().split('T')[0];
      const desc = document.getElementById('anuncio-desc').value.trim();
      const fijado = Boolean(document.getElementById('anuncio-fijado')?.checked);
      const prioridad = (categoria === 'Urgente') ? 'Alta' : 'Normal';

      if (editId) {
        const index = anunciosState.findIndex(a => String(a.id) === String(editId));
        if (index !== -1) {
          anunciosState[index] = {
            ...anunciosState[index],
            titulo,
            categoria,
            prioridad,
            fecha,
            desc,
            fijado,
            autor: maestroState?.nombre || 'Docente Titular'
          };
          saveState();
          showToast("Aviso escolar actualizado exitosamente", "success");
        }
      } else {
        const localId = Date.now();
        anunciosState.unshift({
          id: localId,
          titulo,
          categoria,
          prioridad,
          fecha,
          desc,
          fijado,
          autor: maestroState?.nombre || 'Docente Titular'
        });
        saveState();

        // Enviar al servidor Supabase
        await handleCreateAnnouncement(titulo, desc, { categoria, fecha, fijado, prioridad });
        showToast("Aviso escolar publicado para todas las familias", "success");
      }

      closeNewAnuncioModal();
      updateTeacherViews();
    }

    function handleCreateAnuncio(e) {
      handleCreateOrUpdateAnuncio(e);
    }

    function togglePinAnuncio(id) {
      const anuncio = anunciosState.find(a => String(a.id) === String(id));
      if (!anuncio) return;
      anuncio.fijado = !anuncio.fijado;
      updateTeacherViews();
      showToast(anuncio.fijado ? "Aviso fijado en el tablero" : "Aviso desfijado", "info");
    }

    async function deleteAnnouncement(anuncioId) {
      const teacherId = localStorage.getItem('currentTeacherId') || maestroState.id;
      
      // 1. Eliminar localmente de inmediato para feedback instantáneo
      anunciosState = anunciosState.filter(a => String(a.id) !== String(anuncioId));
      saveState();
      updateTeacherViews();
      showToast("Aviso escolar eliminado", "info");

      // 2. Eliminar de la base de datos en Supabase
      try {
        const res = await fetch(`${API_BASE_URL}/anuncios/${anuncioId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          if (teacherId) loadTeacherAnnouncements(teacherId);
        } else {
          console.error('No se pudo borrar el anuncio del servidor');
        }
      } catch (err) {
        console.error('Error de red al borrar anuncio:', err);
      }
    }

    function deleteAnuncioById(id) {
      if (!confirm("¿Deseas eliminar este comunicado escolar de forma permanente?")) return;
      deleteAnnouncement(id);
    }

    function deleteAnuncio(idx) {
      if (anunciosState[idx]) {
        deleteAnuncioById(anunciosState[idx].id);
      }
    }

    function copyAnuncioWhatsApp(id) {
      const anuncio = anunciosState.find(a => String(a.id) === String(id));
      if (!anuncio) return;
      const emojiCat = {
        'Urgente': '🚨',
        'Reunión': '👨‍👩‍👧‍👦',
        'Evento': '🎉',
        'Académico': '📚',
        'General': '📢'
      }[anuncio.categoria] || '📢';

      const texto = `${emojiCat} *COMUNICADO ESCOLAR: ${anuncio.titulo.toUpperCase()}*\n\n` +
        `📅 *Fecha:* ${anuncio.fecha}\n` +
        `🏷️ *Categoría:* ${anuncio.categoria} ${anuncio.prioridad === 'Alta' ? '*(URGENTE)*' : ''}\n` +
        `👤 *Emitido por:* ${anuncio.autor || maestroState?.nombre || 'Docente Titular'}\n\n` +
        `📝 *Mensaje:*\n${anuncio.desc}\n\n` +
        `🏫 _Lumni - Plataforma Escolar Inteligente_`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
          showToast("Aviso copiado con formato para WhatsApp", "success");
        }).catch(() => {
          fallbackCopyText(texto);
        });
      } else {
        fallbackCopyText(texto);
      }
    }

    function fallbackCopyText(text) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast("Texto copiado al portapapeles", "success");
      } catch (err) {
        showToast("No se pudo copiar automáticamente", "error");
      }
    }

    // ==========================================================
    // 9.7 BOLETA OFICIAL DE CALIFICACIONES (IMPRIMIBLE CON QR)
    // ==========================================================
    let currentBoletaStudent = null;

    function openBoletaModal(uuid) {
      const student = alumnosState.find(a => a.uuid === uuid);
      if (!student) {
        showToast("Alumno no encontrado", "error");
        return;
      }
      currentBoletaStudent = student;
      renderBoletaModal(student);
      document.getElementById('modal-boleta').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeBoletaModal() {
      document.getElementById('modal-boleta').classList.add('hidden');
    }

    function renderBoletaModal(student) {
      document.getElementById('boleta-school-name').textContent = (maestroState.colegio || 'Instituto Lumni').toUpperCase();
      document.getElementById('boleta-ciclo').textContent = `Ciclo Escolar: ${maestroState.ciclo || '2026-2027'}`;
      document.getElementById('boleta-student-name').textContent = student.nombre;
      document.getElementById('boleta-student-group').textContent = maestroState.grupo || '3er Grado Grupo B';
      document.getElementById('boleta-student-tutor').textContent = student.tutor;
      document.getElementById('boleta-teacher-name').textContent = maestroState.nombre;
      document.getElementById('boleta-signature-teacher').textContent = maestroState.nombre;

      // Calificaciones por Asignatura (Enteros en Materias • Decimal en Promedio)
      const tbody = document.getElementById('boleta-grades-tbody');
      let sum = 0;
      let count = 0;
      tbody.innerHTML = materiasState.map(m => {
        const hasVal = student.calificaciones?.[m] !== undefined && student.calificaciones?.[m] !== null && student.calificaciones?.[m] !== '';
        const val = hasVal ? Math.round(parseFloat(student.calificaciones[m]) || 0) : '-';
        if (hasVal) {
          sum += val;
          count++;
        }
        let rating = 'Pendiente';
        if (hasVal) {
          if (val < 6) rating = 'Insuficiente';
          else if (val < 7.5) rating = 'Básico';
          else if (val < 9) rating = 'Satisfactorio';
          else rating = 'Sobresaliente';
        }

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-2.5 font-semibold text-slate-900">${m}</td>
            <td class="px-4 py-2.5 text-center font-mono font-bold text-slate-800">${val}</td>
            <td class="px-4 py-2.5 text-center text-xs font-semibold ${hasVal ? (val >= 9 ? 'text-emerald-700' : (val >= 7 ? 'text-indigo-700' : 'text-amber-700')) : 'text-slate-400'}">${rating}</td>
          </tr>
        `;
      }).join('');

      const avg = count > 0 ? (sum / count) : null;
      document.getElementById('boleta-final-average').textContent = avg !== null ? avg.toFixed(1) : '-';
      let finalRating = 'Sin evaluar';
      if (avg !== null) {
        if (avg < 6) finalRating = 'Insuficiente';
        else if (avg < 7.5) finalRating = 'Básico';
        else if (avg < 9) finalRating = 'Satisfactorio';
        else finalRating = 'Sobresaliente';
      }
      document.getElementById('boleta-final-rating').textContent = finalRating;

      // Resumen de Asistencias
      const pres = student.asistenciasTotales?.presentes || 0;
      const ret = student.asistenciasTotales?.retardos || 0;
      const falt = student.asistenciasTotales?.faltas || 0;
      const total = pres + ret + falt;
      const rate = total > 0 ? Math.round(((pres + ret * 0.5) / total) * 100) : 100;

      document.getElementById('boleta-asist-presentes').textContent = pres;
      document.getElementById('boleta-asist-retardos').textContent = ret;
      document.getElementById('boleta-asist-faltas').textContent = falt;
      document.getElementById('boleta-asist-rate').textContent = `${rate}%`;

      // Mini QR de validación en la Boleta
      const qrTarget = document.getElementById('boleta-qr-target');
      if (qrTarget) {
        qrTarget.innerHTML = '';
        new QRCode(qrTarget, {
          text: student.uuid,
          width: 56,
          height: 56,
          colorDark: "#1e1b4b",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }

    // ==========================================================
    // 9.8 RESPALDO Y RESTAURACIÓN DE DATOS (JSON)
    // ==========================================================
    function exportFullBackupJSON() {
      const fullBackup = {
        sistema: 'Lumni',
        version: '2.0',
        fechaExportacion: new Date().toISOString(),
        maestro: maestroState,
        materias: materiasState,
        alumnos: alumnosState,
        proyectos: proyectosState,
        tareas: tareasState,
        mensajes: mensajesState,
        reportes: reportesState,
        anuncios: anunciosState
      };

      const jsonStr = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lumni_respaldo_escolar_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Copia de seguridad descargada exitosamente", "success");
    }

    function importBackupJSON(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.alumnos || !data.maestro) {
            throw new Error("Estructura de respaldo no válida");
          }
          if (data.maestro) maestroState = data.maestro;
          if (data.materias) materiasState = data.materias;
          if (data.alumnos) alumnosState = data.alumnos;
          if (data.proyectos) proyectosState = data.proyectos;
          if (data.tareas) tareasState = data.tareas;
          if (data.mensajes) mensajesState = data.mensajes;
          if (data.reportes) reportesState = data.reportes;
          if (data.anuncios) anunciosState = data.anuncios;

          saveState();
          updateTeacherViews();
          renderParentDemoChips();
          showToast("Base de datos restaurada correctamente", "success");
        } catch (err) {
          showToast("Error al importar: el archivo JSON no es válido", "error");
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    function resetToDefaultData() {
      if (!confirm("¿Restablecer todos los datos a la demostración inicial? Esta acción reiniciará los registros locales.")) return;
      localStorage.clear();
      location.reload();
    }

    // ==========================================================
    // 10. ALUMNOS & REPORTES
    // ==========================================================
    function handleAlumnoSubmit(e) {
      e.preventDefault();

      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');

      const nombres = document.getElementById('alumno_nombres').value.trim();
      const paterno = document.getElementById('alumno_paterno').value.trim();
      const materno = document.getElementById('alumno_materno')?.value.trim() || '';
      const fechaNac = document.getElementById('alumno_fecha_nac').value;
      const sexo = document.getElementById('alumno_sexo').value;
      let curp = document.getElementById('alumno_curp').value.trim().toUpperCase();
      const tutor = document.getElementById('alumno_tutor').value.trim();
      const telefono = document.getElementById('alumno_telefono').value.trim();

      const nombre_completo = `${nombres} ${paterno} ${materno}`.trim();

      if (!curp) {
        curp = generateSuggestedCURP(nombres, paterno, materno, fechaNac, sexo) || ('CURP' + Date.now());
      }

      const payload = {
        id_maestro: localStorage.getItem('currentTeacherId') || maestroState.id,
        nombres: nombres,
        primer_apellido: paterno,
        segundo_apellido: materno,
        nombre_completo: nombre_completo,
        fecha_nacimiento: fechaNac,
        sexo: sexo,
        curp: curp,
        nombre_tutor: tutor,
        telefono_tutor: telefono
      };

      withLoading(btn, async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/alumnos/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al registrar alumno');
          }

          const data = await res.json();

          const bAlumno = data?.alumno || data?.datos;
          const assignedId = bAlumno?.id || ('alu-' + crypto.randomUUID());

          const nuevoAlumno = {
            id: assignedId,
            uuid: assignedId,
            id_maestro: bAlumno?.id_maestro || payload.id_maestro,
            nombres: nombres,
            primerApellido: paterno,
            segundoApellido: materno,
            nombre: nombre_completo,
            fechaNacimiento: fechaNac,
            sexo: sexo,
            curp: curp || (assignedId ? assignedId.substring(0, 11).toUpperCase() : 'CURP'),
            tutor: tutor,
            telefono: telefono,
            suscripcion: 'activa',
            asistenciaHoy: 'pendiente',
            horaAsistencia: '--:--',
            asistenciasTotales: { presentes: 0, retardos: 0, faltas: 0 },
            calificaciones: {},
            qr_codigo: bAlumno?.qr_codigo || assignedId,
            qr: bAlumno?.qr_codigo || assignedId
          };

          alumnosState.unshift(nuevoAlumno);
          saveState();
          updateTeacherViews();
          renderParentDemoChips();
          form.reset();
          showToast(`¡Alumno ${nuevoAlumno.nombre} inscrito exitosamente!`, "success");
          openQrModal(nuevoAlumno.uuid);
        } catch (err) {
          // Si el backend no está disponible, registrar en modo local
          const localUuid = 'alu-' + crypto.randomUUID();
          const nuevoAlumno = {
            id: localUuid,
            uuid: localUuid,
            nombres: nombres,
            primerApellido: paterno,
            segundoApellido: materno,
            nombre: nombre_completo,
            fechaNacimiento: fechaNac,
            sexo: sexo,
            curp: curp || localUuid.substring(0, 11).toUpperCase(),
            tutor: tutor,
            telefono: telefono,
            suscripcion: 'activa',
            asistenciaHoy: 'pendiente',
            horaAsistencia: '--:--',
            asistenciasTotales: { presentes: 0, retardos: 0, faltas: 0 },
            calificaciones: {},
            qr_codigo: localUuid,
            qr: localUuid
          };

          alumnosState.unshift(nuevoAlumno);
          saveState();
          updateTeacherViews();
          renderParentDemoChips();
          form.reset();
          showToast(`¡Alumno ${nuevoAlumno.nombre} inscrito en tu grupo!`, "success");
          openQrModal(nuevoAlumno.uuid);
        }
      });
    }

    function sortAlumnos(col) {
      if (alumnosSortCol === col) {
        alumnosSortDir = alumnosSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        alumnosSortCol = col;
        alumnosSortDir = 'asc';
      }
      renderAlumnosTable();
      updateSortIconsAlumnos();
    }

    function updateSortIconsAlumnos() {
      ['sort-icon-nombre', 'sort-icon-tutor'].forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        const col = id.replace('sort-icon-', '');
        if (alumnosSortCol !== col) {
          el.innerHTML = '<i data-lucide="chevrons-up-down" class="w-3 h-3 text-slate-400"></i>';
        } else {
          el.innerHTML = alumnosSortDir === 'asc'
            ? '<i data-lucide="chevron-up" class="w-3 h-3 text-brand-600"></i>'
            : '<i data-lucide="chevron-down" class="w-3 h-3 text-brand-600"></i>';
        }
      });
      lucide.createIcons();
    }

    function renderAlumnosTable(filtered = null) {
      const tbody = document.getElementById('alumnos-table-body');
      let data = filtered || [...alumnosState];

      if (alumnosSortCol) {
        data.sort((a, b) => {
          let valA = a[alumnosSortCol]?.toLowerCase() || '';
          let valB = b[alumnosSortCol]?.toLowerCase() || '';
          if (valA < valB) return alumnosSortDir === 'asc' ? -1 : 1;
          if (valA > valB) return alumnosSortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8"><div class="flex flex-col items-center justify-center gap-2 text-slate-400"><i data-lucide="users" class="w-8 h-8 text-slate-300"></i><p class="text-sm font-semibold text-slate-500">No hay alumnos en el grupo</p><p class="text-[11px]">Inscribe un nuevo alumno o importa una lista de Excel.</p></div></td></tr>`;
        return;
      }

      tbody.innerHTML = data.map(a => `
        <tr class="hover:bg-slate-50 dark:bg-slate-800 transition-colors block md:table-row border-b md:border-none border-slate-200 dark:border-slate-700/60 pb-3 md:pb-0 mb-3 md:mb-0">
          <td class="px-4 py-3 block md:table-cell">
            <div class="font-bold text-slate-900 dark:text-slate-100">${a.nombre}</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200/80 dark:border-indigo-800/60 select-all" title="CURP Oficial">${a.curp || a.uuid.substring(0, 14)}</span>
              <button onclick="navigator.clipboard.writeText('${a.curp || a.uuid}').then(() => showToast('CURP copiada al portapapeles', 'success'))" class="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer" title="Copiar CURP">
                <i data-lucide="copy" class="w-3 h-3"></i>
              </button>
            </div>
          </td>
          <td class="px-4 py-3 block md:table-cell">
            <div class="font-medium text-slate-800 dark:text-slate-200">${a.tutor}</div>
            <div class="text-[11px] text-slate-400">${a.telefono}</div>
          </td>
          <td class="px-4 py-3 block md:table-cell">
            <span class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/70 inline-flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Activo</span>
            </span>
          </td>
          <td class="px-4 py-3 block md:table-cell">
            <div class="flex items-center gap-1.5">
              <button onclick="openQrModal('${a.uuid}')" class="px-2.5 py-1 bg-brand-50 dark:bg-brand-900/40 hover:bg-brand-100 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer">
                <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
                <span>Credencial</span>
              </button>
              <button onclick="openBoletaModal('${a.uuid}')" class="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>Boleta</span>
              </button>
            </div>
          </td>
          <td class="px-4 py-3 text-right space-x-1 block md:table-cell">
            <button onclick="openEditModal('${a.uuid}')" title="Editar" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:text-brand-400 rounded-lg cursor-pointer">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteAlumno('${a.uuid}')" title="Eliminar Alumno" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    function filterAlumnosTable() {
      const q = document.getElementById('search-alumnos-input')?.value.toLowerCase().trim() || '';
      let res = [...alumnosState];

      if (q) {
        res = res.filter(a => 
          (a.curp && a.curp.toLowerCase().includes(q)) ||
          (a.nombre && a.nombre.toLowerCase().includes(q)) || 
          (a.tutor && a.tutor.toLowerCase().includes(q)) || 
          (a.telefono && a.telefono.toLowerCase().includes(q)) || 
          (a.uuid && a.uuid.toLowerCase().includes(q))
        );
      }

      renderAlumnosTable(res);
      lucide.createIcons();
    }

    function deleteAlumno(uuid) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;
      if (!confirm(`¿Eliminar a ${a.nombre} de la lista de alumnos?`)) return;

      alumnosState = alumnosState.filter(x => x.uuid !== uuid);
      reportesState = reportesState.filter(r => r.alumnoUuid !== uuid);
      mensajesState = mensajesState.filter(m => m.alumnoUuid !== uuid);
      saveState();
      updateTeacherViews();
      renderParentDemoChips();
      showToast(`Alumno eliminado`, "info");
    }

    function openEditModal(uuid) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;

      document.getElementById('edit-alumno-uuid').value = a.uuid;
      document.getElementById('edit-alumno-nombres').value = a.nombres || a.nombre.split(' ')[0] || '';
      document.getElementById('edit-alumno-paterno').value = a.primerApellido || a.nombre.split(' ')[1] || '';
      document.getElementById('edit-alumno-materno').value = a.segundoApellido || a.nombre.split(' ').slice(2).join(' ') || '';
      document.getElementById('edit-alumno-fecha-nac').value = a.fechaNacimiento || '2017-01-01';
      document.getElementById('edit-alumno-sexo').value = a.sexo || 'M';
      document.getElementById('edit-alumno-curp').value = a.curp || '';
      document.getElementById('edit-alumno-tutor').value = a.tutor || '';
      document.getElementById('edit-alumno-tel').value = a.telefono || '';

      document.getElementById('modal-edit-alumno').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeEditModal() {
      document.getElementById('modal-edit-alumno').classList.add('hidden');
    }

    function handleSaveEditAlumno(e) {
      e.preventDefault();
      const uuid = document.getElementById('edit-alumno-uuid').value;
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;

      const nombres = document.getElementById('edit-alumno-nombres').value.trim();
      const paterno = document.getElementById('edit-alumno-paterno').value.trim();
      const materno = document.getElementById('edit-alumno-materno').value.trim();

      a.nombres = nombres;
      a.primerApellido = paterno;
      a.segundoApellido = materno;
      a.nombre = `${nombres} ${paterno} ${materno}`.trim();
      a.fechaNacimiento = document.getElementById('edit-alumno-fecha-nac').value;
      a.sexo = document.getElementById('edit-alumno-sexo').value;
      a.curp = document.getElementById('edit-alumno-curp').value.trim().toUpperCase();
      a.tutor = document.getElementById('edit-alumno-tutor').value.trim();
      a.telefono = document.getElementById('edit-alumno-tel').value.trim();

      closeEditModal();
      saveState();
      updateTeacherViews();
      renderParentDemoChips();
      showToast("Datos del alumno actualizados", "success");
    }

    function openQrModal(uuid) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;

      currentActiveModalUuid = a.uuid;
      document.getElementById('qr-modal-student-name').textContent = a.nombre;
      document.getElementById('qr-modal-student-group').textContent = maestroState.grupo;
      document.getElementById('qr-modal-student-tutor').textContent = `Tutor: ${a.tutor}`;
      
      const curpTxt = document.getElementById('qr-modal-curp-txt');
      if (curpTxt) curpTxt.textContent = a.curp || 'SIN-CURP';
      
      document.getElementById('qr-modal-uuid-txt').textContent = a.uuid;
      document.getElementById('qr-modal-school-name').textContent = `Lumni • ${maestroState.grupo}`;

      const container = document.getElementById('modal-qrcode-target');
      container.innerHTML = '';

      new QRCode(container, {
        text: a.curp || a.uuid,
        width: 140,
        height: 140,
        colorDark: "#1e1b4b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      document.getElementById('modal-qr-credential').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeQrModal() {
      document.getElementById('modal-qr-credential').classList.add('hidden');
    }

    function copyModalCurp() {
      if (!currentActiveModalUuid) return;
      const a = alumnosState.find(x => x.uuid === currentActiveModalUuid);
      const curp = a?.curp || currentActiveModalUuid;
      navigator.clipboard.writeText(curp).then(() => showToast(`CURP copiada: ${curp}`, "success"));
    }

    function copyModalUuid() {
      if (!currentActiveModalUuid) return;
      navigator.clipboard.writeText(currentActiveModalUuid).then(() => showToast("Código ID copiado", "success"));
    }

    function populateReportesSelect() {
      const select = document.getElementById('reporte_alumno_uuid');
      if (alumnosState.length === 0) {
        select.innerHTML = '<option value="">Sin alumnos</option>';
        return;
      }
      select.innerHTML = alumnosState.map(a => `<option value="${a.uuid}">${a.nombre}</option>`).join('');
    }

    function handleCreateReporte(e) {
      e.preventDefault();
      const alumnoUuid = document.getElementById('reporte_alumno_uuid').value;
      const tipo = document.getElementById('reporte_tipo').value;
      const titulo = document.getElementById('reporte_titulo').value.trim();
      const desc = document.getElementById('reporte_desc').value.trim();

      const nuevoReporte = {
        id: Date.now(),
        alumnoUuid,
        tipo,
        titulo,
        desc,
        fecha: new Date().toISOString().split('T')[0]
      };

      reportesState.unshift(nuevoReporte);
      updateTeacherViews();
      document.getElementById('form-reporte').reset();
      showToast("Reporte emitido al expediente", "success");
    }

    function renderReportesList() {
      const container = document.getElementById('reportes-list-container');
      if (reportesState.length === 0) {
        container.innerHTML = `<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-8 flex flex-col items-center justify-center gap-3"><i data-lucide="clipboard-list" class="w-8 h-8 text-slate-300"></i><div class="text-center"><p class="text-sm font-bold text-slate-700 dark:text-slate-300">Sin reportes registrados</p><p class="text-[11px] text-slate-400">El historial de incidencias y méritos aparecerá aquí.</p></div></div>`;
        return;
      }

      const badgeStyles = {
        'Felicitación': 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 border-emerald-200',
        'Conducta': 'bg-rose-50 dark:bg-rose-900/40 text-rose-800 border-rose-200',
        'Citatorio': 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-800 border-indigo-200',
        'Aviso': 'bg-amber-50 dark:bg-amber-900/40 text-amber-800 border-amber-200'
      };

      container.innerHTML = reportesState.map((rep, idx) => {
        const a = alumnosState.find(x => x.uuid === rep.alumnoUuid) || { nombre: 'Alumno' };
        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyles[rep.tipo] || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}">
                  ${rep.tipo}
                </span>
                <span class="font-bold text-xs text-slate-900 dark:text-slate-100">${a.nombre}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-400">${rep.fecha}</span>
                <button onclick="deleteReporte(${idx})" class="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" title="Eliminar" aria-label="Eliminar reporte">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">${rep.titulo}</h4>
            <p class="text-xs text-slate-600 dark:text-slate-400">${rep.desc}</p>
          </div>
        `;
      }).join('');
    }

    function deleteReporte(index) {
      reportesState.splice(index, 1);
      updateTeacherViews();
      showToast("Reporte eliminado", "info");
    }

    function renderDashboardActivity() {
      const container = document.getElementById('dash-activity-list');
      const presentAlumnos = alumnosState.filter(a => a.asistenciaHoy === 'presente');

      if (presentAlumnos.length === 0) {
        container.innerHTML = `<p class="text-slate-400 py-6 text-center text-xs">No hay asistencias registradas hoy.</p>`;
        return;
      }

      container.innerHTML = presentAlumnos.slice(0, 5).map(a => `
        <div class="py-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <div>
              <p class="font-bold text-slate-800 dark:text-slate-200">${a.nombre}</p>
              <p class="text-[11px] text-slate-400">Entrada registrada • ${a.horaAsistencia}</p>
            </div>
          </div>
          <button onclick="openQrModal('${a.uuid}')" class="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300">
            Credencial
          </button>
        </div>
      `).join('');
    }

    // ==========================================================
    // 11. EXPORTACIÓN A CSV
    // ==========================================================
    function downloadCSV(csvContent, filename) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function exportAlumnosCSV() {
      if (alumnosState.length === 0) {
        showToast("No hay alumnos para exportar", "error");
        return;
      }
      let csv = "CURP,Nombre Completo,Tutor,Telefono,UUID\n";
      alumnosState.forEach(a => {
        csv += `"${a.curp || ''}","${a.nombre}","${a.tutor}","${a.telefono}","${a.uuid}"\n`;
      });
      downloadCSV(csv, "alumnos_lumni.csv");
      showToast("Reporte de alumnos exportado con CURP", "success");
    }

    function exportAsistenciasCSV() {
      if (alumnosState.length === 0) {
        showToast("No hay asistencias para exportar", "error");
        return;
      }
      let csv = "Nombre,Estado Hoy,Hora,Presentes,Retardos,Faltas\n";
      alumnosState.forEach(a => {
        const p = a.asistenciasTotales?.presentes || 0;
        const r = a.asistenciasTotales?.retardos || 0;
        const f = a.asistenciasTotales?.faltas || 0;
        csv += `"${a.nombre}","${a.asistenciaHoy}","${a.horaAsistencia}",${p},${r},${f}\n`;
      });
      downloadCSV(csv, "asistencias_lumni.csv");
      showToast("Reporte de asistencias exportado", "success");
    }

    function exportCalificacionesCSV() {
      if (alumnosState.length === 0) {
        showToast("No hay calificaciones para exportar", "error");
        return;
      }
      let csv = "Nombre," + materiasState.map(m => `"${m}"`).join(",") + ",Promedio\n";
      alumnosState.forEach(a => {
        let sum = 0, count = 0;
        let row = `"${a.nombre}",`;
        materiasState.forEach(m => {
          const rawVal = a.calificaciones?.[m] !== undefined ? a.calificaciones[m] : 9;
          const val = Math.round(parseFloat(rawVal) || 0);
          sum += val;
          count++;
          row += `${val},`;
        });
        const prom = count > 0 ? (sum / count).toFixed(1) : '10.0';
        row += `${prom}\n`;
        csv += row;
      });
      downloadCSV(csv, "calificaciones_lumni.csv");
      showToast("Reporte de calificaciones exportado", "success");
    }

    // ==========================================================
    // 11.5 IMPORTACIÓN Y PLANTILLA EXCEL (.XLSX, .XLS, .CSV)
    // ==========================================================
    let parsedExcelData = null;

    function openImportExcelModal() {
      parsedExcelData = null;
      const fileInput = document.getElementById('excel-file-input');
      if (fileInput) fileInput.value = '';
      const previewContainer = document.getElementById('excel-preview-container');
      if (previewContainer) previewContainer.classList.add('hidden');
      const applyBtn = document.getElementById('btn-apply-excel');
      if (applyBtn) applyBtn.disabled = true;

      document.getElementById('modal-import-excel').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeImportExcelModal() {
      document.getElementById('modal-import-excel').classList.add('hidden');
      parsedExcelData = null;
    }

    function handleExcelDrop(e) {
      e.preventDefault();
      const dropzone = document.getElementById('excel-dropzone');
      if (dropzone) dropzone.classList.remove('border-emerald-500', 'bg-emerald-50/50', 'dark:bg-emerald-950/30');

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        readAndProcessExcelFile(file);
      }
    }

    function handleExcelFileSelect(e) {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        readAndProcessExcelFile(file);
      }
    }

    function readAndProcessExcelFile(file) {
      if (!file) return;
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        showToast("Por favor selecciona un archivo válido (.xlsx, .xls o .csv)", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (!jsonData || jsonData.length < 2) {
            showToast("El archivo está vacío o no contiene suficientes filas.", "error");
            return;
          }

          processExcelParsedRows(jsonData, file.name);
        } catch (err) {
          console.error("Error al procesar archivo Excel:", err);
          showToast("Error al leer el archivo Excel. Verifica el formato.", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    }

    function processExcelParsedRows(rawRows, filename) {
      // 1. Detectar automáticamente la fila de encabezados (por si el Excel tiene títulos arriba)
      let headerRowIdx = -1;
      let nameIdx = -1;
      let headers = [];

      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const potentialHeaders = (rawRows[r] || []).map(h => String(h || '').trim());
        const foundNameIdx = potentialHeaders.findIndex(h => {
          const norm = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return norm.includes("nombre") || norm.includes("alumno") || norm.includes("estudiante") || norm.includes("estudiantes") || norm.includes("student") || norm.includes("apellidos");
        });

        if (foundNameIdx !== -1) {
          headerRowIdx = r;
          nameIdx = foundNameIdx;
          headers = potentialHeaders;
          break;
        }
      }

      // Si no se detectó por nombre, usar la fila 0
      if (headerRowIdx === -1) {
        headerRowIdx = 0;
        headers = (rawRows[0] || []).map(h => String(h || '').trim());
        nameIdx = 0;
      }
      
      // Buscar columna de Tutor (si existe)
      let tutorIdx = headers.findIndex(h => {
        const norm = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return norm.includes("tutor") || norm.includes("padre") || norm.includes("madre") || norm.includes("familiar") || norm.includes("responsable");
      });

      // Buscar columna de Teléfono (si existe)
      let telIdx = headers.findIndex(h => {
        const norm = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return norm.includes("telefono") || norm.includes("teléfono") || norm.includes("celular") || norm.includes("whatsapp") || norm.includes("phone") || norm.includes("contacto");
      });

      // Identificar columnas de materias (cualquier columna que no sea metadato)
      const subjectCols = [];
      const ignoredHeaders = [
        "no", "no.", "n°", "#", "num", "numero", "número", "item",
        "uuid", "id", "matricula", "matrícula", "curp", "clave",
        "tutor", "padre", "madre", "familiar", "telefono", "teléfono", "celular", "contacto",
        "promedio", "prom", "average", "observaciones", "asistencia", "faltas", "retardos",
        "estatus", "estado", "grado", "grupo", "seccion", "sección", "nivel", "turno", "ciclo"
      ];
      
      headers.forEach((h, idx) => {
        if (idx === nameIdx || idx === tutorIdx || idx === telIdx) return;
        const norm = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (!norm) return;
        if (ignoredHeaders.some(ign => norm === ign || norm.startsWith(ign + ' ') || norm.startsWith(ign + '.') || norm.startsWith(ign + '_'))) return;

        subjectCols.push({
          index: idx,
          name: h
        });
      });

      // Si no se detectaron materias pero existen materias en el sistema, intentar coincidir
      if (subjectCols.length === 0) {
        materiasState.forEach(m => {
          const idx = headers.findIndex(h => h.toLowerCase().trim() === m.toLowerCase().trim());
          if (idx !== -1) subjectCols.push({ index: idx, name: m });
        });
      }

      // Buscar columna opcional de CURP
      const curpIdx = headers.findIndex(h => h.includes('curp') || h.includes('clave') || h.includes('identificador'));

      // Procesar filas de alumnos (a partir de la fila siguiente a los encabezados)
      const rows = [];
      for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
        const row = rawRows[r] || [];
        const studentName = String(row[nameIdx] || '').trim();
        // Ignorar filas vacías o filas de pie de página (ej. "Promedios", "Totales", etc.)
        if (!studentName || studentName.toLowerCase().startsWith('promedio') || studentName.toLowerCase().startsWith('total') || studentName.toLowerCase().startsWith('firma')) continue;

        const curpVal = curpIdx !== -1 ? String(row[curpIdx] || '').trim().toUpperCase() : '';
        const tutorName = tutorIdx !== -1 ? String(row[tutorIdx] || '').trim() : 'Tutor';
        const phone = telIdx !== -1 ? String(row[telIdx] || '').trim() : '+52 55 0000 0000';

        const grades = {};
        let sum = 0, count = 0;

        subjectCols.forEach(sc => {
          let rawVal = String(row[sc.index] !== undefined ? row[sc.index] : '').trim().replace(',', '.');
          let num = parseFloat(rawVal);
          
          if (isNaN(num)) {
            // Si está vacío o texto no numérico
            num = 9;
          }
          // Redondear estrictamente a número entero entre 0 y 10
          let intGrade = Math.round(num);
          if (intGrade < 0) intGrade = 0;
          if (intGrade > 10) intGrade = 10;

          grades[sc.name] = intGrade;
          sum += intGrade;
          count++;
        });

        const calculatedAvg = count > 0 ? (sum / count).toFixed(1) : '10.0';
        const existingStudent = alumnosState.find(a => 
          (curpVal && a.curp && a.curp.toLowerCase() === curpVal.toLowerCase()) ||
          (a.nombre.toLowerCase().trim() === studentName.toLowerCase().trim())
        );

        rows.push({
          curp: curpVal || (existingStudent ? existingStudent.curp : ''),
          nombre: studentName,
          tutor: tutorName || (existingStudent ? existingStudent.tutor : 'Tutor'),
          telefono: phone || (existingStudent ? existingStudent.telefono : '+52 55 0000 0000'),
          calificaciones: grades,
          promedio: calculatedAvg,
          isNew: !existingStudent,
          existingUuid: existingStudent ? existingStudent.uuid : null
        });
      }

      if (rows.length === 0) {
        showToast("No se encontraron registros de alumnos legibles en el archivo.", "error");
        return;
      }

      parsedExcelData = {
        filename,
        headers,
        subjects: subjectCols.map(s => s.name),
        rows
      };

      renderExcelPreviewTable();
    }

    function renderExcelPreviewTable() {
      if (!parsedExcelData) return;

      const previewContainer = document.getElementById('excel-preview-container');
      const filenameBadge = document.getElementById('excel-file-name-badge');
      const statTotal = document.getElementById('excel-stat-total');
      const statMaterias = document.getElementById('excel-stat-materias');
      const thead = document.getElementById('excel-preview-thead');
      const tbody = document.getElementById('excel-preview-tbody');
      const applyBtn = document.getElementById('btn-apply-excel');

      filenameBadge.textContent = parsedExcelData.filename;
      statTotal.textContent = `${parsedExcelData.rows.length} Alumnos detectados`;
      statMaterias.textContent = `${parsedExcelData.subjects.length} Materias`;

      // Thead
      let thHtml = `<tr>
        <th class="px-3 py-2 text-left">Alumno</th>
        <th class="px-3 py-2 text-left">Estado</th>`;
      parsedExcelData.subjects.forEach(sub => {
        thHtml += `<th class="px-2 py-2 text-center">${sub} (Entero)</th>`;
      });
      thHtml += `<th class="px-3 py-2 text-center">Promedio (Decimal)</th></tr>`;
      thead.innerHTML = thHtml;

      // Tbody
      tbody.innerHTML = parsedExcelData.rows.map(r => {
        let rowHtml = `<tr class="hover:bg-slate-50 dark:bg-slate-800 transition-colors">
          <td class="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
            <div>${r.nombre}</div>
            ${r.curp ? `<div class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">${r.curp}</div>` : ''}
          </td>
          <td class="px-3 py-2">
            ${r.isNew 
              ? '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200">🆕 Nuevo</span>'
              : '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">🟢 En Lista</span>'
            }
          </td>`;

        parsedExcelData.subjects.forEach(sub => {
          const g = r.calificaciones[sub] !== undefined ? r.calificaciones[sub] : 9;
          rowHtml += `<td class="px-2 py-2 text-center font-mono font-bold text-slate-800 dark:text-slate-200">${g}</td>`;
        });

        rowHtml += `<td class="px-3 py-2 text-center font-bold text-brand-600 dark:text-brand-400 font-mono">${r.promedio}</td>
        </tr>`;
        return rowHtml;
      }).join('');

      previewContainer.classList.remove('hidden');
      applyBtn.disabled = false;
      lucide.createIcons();
    }

    function applyExcelGradesImport() {
      if (!parsedExcelData || !parsedExcelData.rows || parsedExcelData.rows.length === 0) {
        showToast("No hay datos para importar", "error");
        return;
      }

      const autoRegister = document.getElementById('excel-opt-auto-register')?.checked !== false;
      const autoMaterias = document.getElementById('excel-opt-auto-materias')?.checked !== false;

      // 1. Agregar materias nuevas si está habilitado
      if (autoMaterias && parsedExcelData.subjects.length > 0) {
        parsedExcelData.subjects.forEach(sub => {
          if (!materiasState.includes(sub)) {
            materiasState.push(sub);
          }
        });
      }

      let updatedCount = 0;
      let newCount = 0;

      // 2. Procesar filas
      parsedExcelData.rows.forEach(row => {
        let student = alumnosState.find(a => 
          (row.curp && a.curp && a.curp.toLowerCase() === row.curp.toLowerCase()) ||
          (a.nombre.toLowerCase().trim() === row.nombre.toLowerCase().trim())
        );
        
        if (student) {
          if (!student.calificaciones) student.calificaciones = {};
          // Asignar notas de materias en números enteros
          Object.keys(row.calificaciones).forEach(mat => {
            student.calificaciones[mat] = Math.round(Number(row.calificaciones[mat]));
          });
          if (row.curp && !student.curp) student.curp = row.curp;
          if (row.tutor && row.tutor !== 'Tutor') student.tutor = row.tutor;
          if (row.telefono && row.telefono !== '+52 55 0000 0000') student.telefono = row.telefono;
          updatedCount++;
        } else if (autoRegister) {
          const parts = row.nombre.split(' ');
          const curpFinal = row.curp || generateSuggestedCURP(parts[0] || '', parts[1] || '', parts.slice(2).join(' ') || '', '2017-01-01', 'M') || ('CURP' + Date.now());

          const newStudent = {
            uuid: 'alu-' + crypto.randomUUID(),
            nombres: parts[0] || 'Alumno',
            primerApellido: parts[1] || '',
            segundoApellido: parts.slice(2).join(' ') || '',
            nombre: row.nombre,
            fechaNacimiento: '2017-01-01',
            sexo: 'M',
            curp: curpFinal,
            tutor: row.tutor || 'Tutor Registrado',
            telefono: row.telefono || '+52 55 0000 0000',
            suscripcion: 'activa',
            asistenciaHoy: 'pendiente',
            horaAsistencia: '--:--',
            asistenciasTotales: { presentes: 0, retardos: 0, faltas: 0 },
            calificaciones: {}
          };
          // Inicializar materias
          materiasState.forEach(m => {
            if (row.calificaciones[m] !== undefined && row.calificaciones[m] !== null && row.calificaciones[m] !== '') {
              newStudent.calificaciones[m] = Math.round(Number(row.calificaciones[m]));
            }
          });
          alumnosState.push(newStudent);
          newCount++;
        }
      });

      saveState();
      updateTeacherViews();
      renderParentDemoChips();
      closeImportExcelModal();

      let msg = `¡Calificaciones importadas con éxito! (${updatedCount} actualizados`;
      if (newCount > 0) msg += `, ${newCount} nuevos inscritos`;
      msg += `)`;

      showToast(msg, "success");
    }

    function downloadExcelTemplate(format = 'xlsx') {
      try {
        const headers = ["CURP", "Nombre Completo", "Tutor", "Teléfono", ...materiasState, "Promedio"];
        const sampleData = [headers];

        if (alumnosState.length > 0) {
          alumnosState.forEach(a => {
            let sum = 0, count = 0;
            const gradesRow = materiasState.map(m => {
              const val = a.calificaciones?.[m] !== undefined ? Math.round(parseFloat(a.calificaciones[m]) || 0) : 9;
              sum += val;
              count++;
              return val;
            });
            const prom = count > 0 ? (sum / count).toFixed(1) : '10.0';
            sampleData.push([(a.curp || ''), a.nombre, a.tutor, a.telefono, ...gradesRow, prom]);
          });
        } else {
          sampleData.push(["MARS170514M", "Sofía Martínez Ruiz", "Carmen Ruiz García", "+52 55 9876 5432", 10, 9, 10, 10, "9.8"]);
          sampleData.push(["HEVM170820H", "Mateo Hernández Vega", "Roberto Hernández", "+52 55 4321 8765", 9, 8, 9, 8, "8.5"]);
        }

        const cleanGroupName = (maestroState.grupo || 'grupo').replace(/[\s\/\\:]+/g, '_');

        if (format === 'csv') {
          let csvContent = "";
          sampleData.forEach(row => {
            csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
          });
          downloadCSV(csvContent, `plantilla_calificaciones_${cleanGroupName}.csv`);
          showToast("Plantilla CSV descargada con éxito", "success");
          return;
        }

        const ws = XLSX.utils.aoa_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");

        XLSX.writeFile(wb, `plantilla_calificaciones_${cleanGroupName}.xlsx`);
        showToast("Plantilla Excel (.xlsx) generada y descargada", "success");
      } catch (err) {
        console.error("Error al generar plantilla Excel:", err);
        showToast("Error al generar plantilla Excel", "error");
      }
    }

    function renovarSuscripcionDocente() {
      if (!maestroState.suscripcion) {
        maestroState.suscripcion = {
          estado: 'activa',
          plan: 'Docente Pro',
          pagoInicial: 250,
          mensualidad: 50,
          proximoPago: '01 de Noviembre 2026',
          ultimoPagoMonto: 50,
          mesesActivo: 2
        };
      } else {
        maestroState.suscripcion.mesesActivo = (maestroState.suscripcion.mesesActivo || 1) + 1;
        maestroState.suscripcion.ultimoPagoMonto = 50;
        maestroState.suscripcion.proximoPago = '01 de Noviembre 2026';
      }
      saveState();
      updateTeacherViews();
      showToast("¡Pago de mensualidad de $50 MXN procesado con éxito! Suscripción extendida por 30 días.", "success");
    }

    // ==========================================================
    // 12. NOTIFICACIONES TOAST
    // ==========================================================
    let lastToastMessage = '';
    let lastToastTime = 0;

    function showToast(message, type = 'info') {
      const now = Date.now();
      // Evitar spam de notificaciones idénticas repetidas en menos de 1.8 segundos
      if (lastToastMessage === message && (now - lastToastTime) < 1800) {
        return;
      }
      lastToastMessage = message;
      lastToastTime = now;

      const container = document.getElementById('toast-container');
      if (!container) return;

      // Limitar a máximo 3 toasts visibles en pantalla simultáneamente
      while (container.children.length >= 3) {
        container.firstElementChild.remove();
      }

      const toast = document.createElement('div');

      const styles = {
        success: 'bg-emerald-600 text-white border-emerald-500',
        error: 'bg-rose-600 text-white border-rose-500',
        info: 'bg-slate-900 text-white border-slate-700'
      };
      const icons = { success: 'check-circle-2', error: 'alert-circle', info: 'info' };

      toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold transition-all transform duration-300 translate-y-2 opacity-0 ${styles[type] || styles.info}`;
      toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;

      container.appendChild(toast);
      lucide.createIcons();

      setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 20);
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    // ==========================================================
    // 13. INSTALACIÓN PWA
    // ==========================================================
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const banner = document.getElementById('pwa-install-banner');
      if (banner && !localStorage.getItem('lumni_pwa_dismissed')) {
        banner.classList.remove('hidden');
      }
    });

    function dismissPWAInstall() {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.add('hidden');
      localStorage.setItem('lumni_pwa_dismissed', 'true');
    }

    async function installPWA() {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.add('hidden');
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
    }

    // ==========================================================
    // INICIALIZACIÓN
    // ==========================================================
    window.addEventListener('DOMContentLoaded', () => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      document.getElementById('current-date-badge').textContent = `📅 ${new Date().toLocaleDateString('es-ES', options)}`;

      document.getElementById('login_correo').value = maestroState.correo;
      document.getElementById('reg_nombre').value = maestroState.nombre;
      document.getElementById('reg_correo').value = maestroState.correo;

      const { grado, grupo } = parseGradoYGrupo(maestroState.grupo);
      const regGradoSel = document.getElementById('reg_grado_sel');
      if (regGradoSel) regGradoSel.value = grado;
      const regGrupoSel = document.getElementById('reg_grupo_sel');
      if (regGrupoSel) regGrupoSel.value = grupo;

      renderParentDemoChips();

      // INICIA EN LA LANDING
      showView('view-landing');
    });
