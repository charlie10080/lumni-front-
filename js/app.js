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
    let alumnosState = JSON.parse(localStorage.getItem('lumni_alumnos')) || [
      {
        uuid: 'alu-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        nombres: 'Sofía',
        primerApellido: 'Martínez',
        segundoApellido: 'Ruiz',
        nombre: 'Sofía Martínez Ruiz',
        fechaNacimiento: '2017-05-14',
        sexo: 'M',
        curp: 'MARS170514M',
        tutor: 'Carmen Ruiz García',
        telefono: '+52 55 9876 5432',
        suscripcion: 'activa',
        asistenciaHoy: 'presente',
        horaAsistencia: '08:02 AM',
        asistenciasTotales: { presentes: 22, retardos: 1, faltas: 0 },
        calificaciones: { 'Español': 10, 'Matemáticas': 9, 'Ciencias Naturales': 10, 'Historia': 10 }
      },
      {
        uuid: 'alu-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        nombres: 'Mateo',
        primerApellido: 'Hernández',
        segundoApellido: 'Vega',
        nombre: 'Mateo Hernández Vega',
        fechaNacimiento: '2017-08-20',
        sexo: 'H',
        curp: 'HEVM170820H',
        tutor: 'Roberto Hernández',
        telefono: '+52 55 4321 8765',
        suscripcion: 'activa',
        asistenciaHoy: 'presente',
        horaAsistencia: '08:15 AM',
        asistenciasTotales: { presentes: 20, retardos: 2, faltas: 1 },
        calificaciones: { 'Español': 9, 'Matemáticas': 8, 'Ciencias Naturales': 9, 'Historia': 8 }
      },
      {
        uuid: 'alu-5f6e7d8c-9b0a-1a2b-3c4d-5e6f7a8b9c0d',
        nombres: 'Valentina',
        primerApellido: 'López',
        segundoApellido: 'Cruz',
        nombre: 'Valentina López Cruz',
        fechaNacimiento: '2017-11-03',
        sexo: 'M',
        curp: 'LOCV171103M',
        tutor: 'Laura Cruz Mendoza',
        telefono: '+52 55 6789 0123',
        suscripcion: 'activa',
        asistenciaHoy: 'pendiente',
        horaAsistencia: '--:--',
        asistenciasTotales: { presentes: 19, retardos: 0, faltas: 2 },
        calificaciones: { 'Español': 9, 'Matemáticas': 9, 'Ciencias Naturales': 10, 'Historia': 9 }
      }
    ];

    alumnosState.forEach(a => {
      if (!a.suscripcion) a.suscripcion = 'activa';
      if (!a.curp) {
        a.curp = a.uuid ? a.uuid.substring(0, 11).toUpperCase() : 'CURP' + Date.now();
      }
      if (a.curp && a.curp.length > 11) {
        // Recortar a 11 caracteres si tenía CURP completa previa
        a.curp = a.curp.substring(0, 11);
      }
      if (!a.nombres && a.nombre) {
        const parts = a.nombre.split(' ');
        a.nombres = parts[0] || 'Alumno';
        a.primerApellido = parts[1] || '';
        a.segundoApellido = parts.slice(2).join(' ') || '';
      }
      // Asegurar enteros en materias existentes
      if (a.calificaciones) {
        Object.keys(a.calificaciones).forEach(k => {
          a.calificaciones[k] = Math.round(parseFloat(a.calificaciones[k]) || 9);
        });
      }
    });

    // Proyectos Escolares
    let proyectosState = JSON.parse(localStorage.getItem('lumni_proyectos')) || [
      {
        id: 1,
        titulo: 'Feria de Ciencias: Ecosistemas',
        campos: ['Saberes y Pensamiento Científico', 'Lenguajes'],
        fecha: '2026-09-15',
        desc: 'Elaboración de maqueta interactiva y exposición oral sobre biomas.',
        calificaciones: {
          'alu-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d': 10,
          'alu-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d': 9
        }
      }
    ];

    // Tareas Escolares
    let tareasState = JSON.parse(localStorage.getItem('lumni_tareas')) || [
      {
        id: 101,
        titulo: 'Antología de Cuentos y Poemas',
        campos: ['Lenguajes'],
        fecha: '2026-09-28',
        desc: 'Redacción de textos creativos y análisis de figuras literarias.',
        calificaciones: {
          'alu-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d': 10,
          'alu-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d': 9
        }
      },
      {
        id: 102,
        titulo: 'Resolución de Problemas con Fracciones',
        campos: ['Saberes y Pensamiento Científico'],
        fecha: '2026-09-30',
        desc: 'Páginas 45 a 48 del libro de matemáticas aplicadas.',
        calificaciones: {
          'alu-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d': 9,
          'alu-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d': 8
        }
      }
    ];

    // Mensajería Asíncrona (Hilos y Mensajes)
    let mensajesState = JSON.parse(localStorage.getItem('lumni_mensajes')) || [
      {
        id: 1,
        alumnoUuid: 'alu-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        asunto: 'Justificante de Inasistencia',
        leidoPorMaestro: false,
        mensajes: [
          {
            remitente: 'padre',
            autor: 'Carmen Ruiz García (Tutor)',
            texto: 'Estimado profesor Carlos, le informo que Sofía tuvo consulta médica por un cuadro gripal el día de ayer. Ya se encuentra recuperada para reintegrarse a clases.',
            fecha: '2026-08-24 08:30 AM'
          },
          {
            remitente: 'maestro',
            autor: 'Prof. Carlos Mendoza',
            texto: 'Hola Sra. Carmen, enterado. Ya justifiqué la falta en el sistema. Que tenga excelente día.',
            fecha: '2026-08-24 09:15 AM'
          }
        ]
      },
      {
        id: 2,
        alumnoUuid: 'alu-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        asunto: 'Duda sobre Tarea o Proyecto',
        leidoPorMaestro: true,
        mensajes: [
          {
            remitente: 'padre',
            autor: 'Roberto Hernández (Tutor)',
            texto: 'Profesor, ¿los materiales para la maqueta de ciencias son libres o se requiere algún formato en especial?',
            fecha: '2026-08-23 04:20 PM'
          },
          {
            remitente: 'maestro',
            autor: 'Prof. Carlos Mendoza',
            texto: 'Buenas tardes Sr. Roberto. Son libres, de preferencia material reciclado como cartón y plastilina.',
            fecha: '2026-08-23 05:00 PM'
          }
        ]
      }
    ];

    // Reportes Individuales
    let reportesState = JSON.parse(localStorage.getItem('lumni_reportes')) || [
      {
        id: 201,
        alumnoUuid: 'alu-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        tipo: 'Felicitación',
        titulo: 'Excelente Liderazgo en Feria de Ciencias',
        desc: 'Sofía demostró una sobresaliente capacidad de organización y apoyo con sus compañeros.',
        fecha: '2026-08-20'
      }
    ];

    function saveState() {
      localStorage.setItem('lumni_maestro', JSON.stringify(maestroState));
      localStorage.setItem('lumni_materias', JSON.stringify(materiasState));
      localStorage.setItem('lumni_alumnos', JSON.stringify(alumnosState));
      localStorage.setItem('lumni_proyectos', JSON.stringify(proyectosState));
      localStorage.setItem('lumni_tareas', JSON.stringify(tareasState));
      localStorage.setItem('lumni_mensajes', JSON.stringify(mensajesState));
      localStorage.setItem('lumni_reportes', JSON.stringify(reportesState));
      localStorage.setItem('lumni_anuncios', JSON.stringify(anunciosState));
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

    function logout() {
      showView('view-landing');
      showToast("Sesión cerrada", "info");
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
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span>Cargando...</span>';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        openTeacherDashboard();
        showToast(`¡Bienvenido de nuevo, ${maestroState.nombre}!`, "success");
      }, 500);
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

      const gradoSel = document.getElementById('reg_grado_sel');
      const grupoSel = document.getElementById('reg_grupo_sel');
      const grupoFormateado = (gradoSel && grupoSel) 
        ? `${gradoSel.value} ${grupoSel.value}` 
        : (document.getElementById('reg_grupo')?.value?.trim() || '3er Grado Grupo B');

      const payload = {
        nombre: document.getElementById('reg_nombre').value.trim(),
        email: document.getElementById('reg_correo').value.trim(),
        password: document.getElementById('reg_password').value.trim(),
        grupo: grupoFormateado,
        telefono: "No especificado",
        plan: "Individual"
      };

      withLoading(btn, async () => {
        try {
          const res = await fetch('http://localhost:3000/api/maestros/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al registrar maestro');
          }

          const data = await res.json();
          if (data.datos && data.datos.id) {
            localStorage.setItem('currentTeacherId', data.datos.id);
          }
          maestroState.nombre = payload.nombre;
          maestroState.correo = payload.email;
          maestroState.grupo = payload.grupo;
          saveState();

          openTeacherDashboard();
          showToast(`¡Registro completado! Bienvenido(a), ${maestroState.nombre}`, "success");
        } catch (err) {
          // Si el backend no está disponible, registrar en modo local
          maestroState.nombre = payload.nombre;
          maestroState.correo = payload.email;
          maestroState.grupo = payload.grupo;
          saveState();

          openTeacherDashboard();
          showToast(`¡Registro completado! Bienvenido(a), ${maestroState.nombre}`, "success");
        }
      });
    }

    function openTeacherDashboard() {
      showView('view-portal-maestro');
      switchTeacherTab('dashboard');
      updateTeacherViews();
    }

    const TEACHER_TABS = [
      { id: 'dashboard', title: 'Panel Principal', subtitle: 'Visión general del ciclo escolar' },
      { id: 'alumnos', title: 'Alumnos & QR', subtitle: 'Gestión y credenciales digitales de acceso' },
      { id: 'asistencias', title: 'Control de Asistencias', subtitle: 'Pase de lista con cámara trasera forzada' },
      { id: 'calificaciones', title: 'Reporte de Evaluación', subtitle: 'Plantilla de materias y promedios oficiales' },
      { id: 'proyectos', title: 'Proyectos Escolares', subtitle: 'Actividades articuladas con Campos Formativos' },
      { id: 'tareas', title: 'Tareas y Asignaciones', subtitle: 'Ejercicios para casa con Campos Formativos' },
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
              const span = btnEl.querySelector('span:not(#sidebar-unread-badge)');
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
              const span = btnEl.querySelector('span:not(#sidebar-unread-badge)');
              if (span) span.className = "whitespace-nowrap font-medium text-sm text-left flex-1";
            }
          }
        }
      });

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

    function openParentPortalByQuery(query) {
      const q = (query || '').toLowerCase().trim();
      const alumno = alumnosState.find(a => {
        const curpMatch = a.curp && a.curp.toLowerCase().trim() === q;
        const uuidMatch = a.uuid && (a.uuid.toLowerCase() === q || a.uuid.toLowerCase().includes(q));
        const nombreMatch = a.nombre && a.nombre.toLowerCase().trim() === q;
        return curpMatch || uuidMatch || nombreMatch;
      });

      if (!alumno) {
        showToast("No se encontró ningún alumno con esa CURP o Código. Verifica los datos.", "error");
        return;
      }

      playScanChime('success');
      if (isParentCameraActive) stopParentQrCamera();

      currentParentStudent = alumno;
      renderParentPortal(alumno);
      showView('view-portal-padres');
      showToast(`Reporte de Evaluación de ${alumno.nombre} cargado`, "success");
    }

    function openParentPortalByUuid(uuidQuery) {
      openParentPortalByQuery(uuidQuery);
    }

    function renderParentPortal(alumno) {
      // 1. Datos del Alumno
      document.getElementById('p-avatar').textContent = alumno.nombre.charAt(0).toUpperCase();
      document.getElementById('p-nombre').textContent = alumno.nombre;
      
      const curpBadge = document.getElementById('p-curp-badge');
      if (curpBadge) {
        curpBadge.textContent = `CURP: ${alumno.curp || 'SIN-CURP'}`;
      }

      document.getElementById('p-grupo-tutor').textContent = `${maestroState.grupo} • Tutor: ${alumno.tutor}`;
      document.getElementById('p-profesor').textContent = `Docente Titular: ${maestroState.nombre}`;
      document.getElementById('p_msg_tutor_name').value = alumno.tutor;

      // 2. Asistencias
      const att = alumno.asistenciasTotales || { presentes: 22, retardos: 1, faltas: 0 };
      const total = (att.presentes + att.retardos + att.faltas) || 1;
      const rate = Math.round(((att.presentes + (att.retardos * 0.5)) / total) * 100);

      document.getElementById('p-asist-presentes').textContent = att.presentes;
      document.getElementById('p-asist-retardos').textContent = att.retardos;
      document.getElementById('p-asist-faltas').textContent = att.faltas;
      document.getElementById('p-asist-rate-badge').textContent = `${rate}%`;
      document.getElementById('p-asist-hoy-badge').textContent = alumno.asistenciaHoy === 'presente' ? `Presente (${alumno.horaAsistencia})` : (alumno.asistenciaHoy === 'retardo' ? 'Retardo' : 'Pendiente / Falta');

      // 3. Reporte de Evaluación (Materias Enteras • Promedio con Decimales)
      const matContainer = document.getElementById('p-materias-list');
      let sum = 0, count = 0;

      matContainer.innerHTML = materiasState.map(m => {
        const rawCal = (alumno.calificaciones && alumno.calificaciones[m] !== undefined) ? alumno.calificaciones[m] : 9;
        const cal = Math.round(parseFloat(rawCal) || 0);
        sum += cal;
        count++;
        return `
          <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span class="font-bold text-slate-800 dark:text-slate-200">${m}</span>
            <span class="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold text-brand-700 dark:text-brand-300 text-xs shadow-2xs">
              ${cal}
            </span>
          </div>
        `;
      }).join('');

      const avgDecimal = count > 0 ? (sum / count).toFixed(1) : '10.0';
      document.getElementById('p-promedio-general').textContent = `Promedio General: ${avgDecimal}`;

      // 4. Proyectos Escolares
      const projContainer = document.getElementById('p-proyectos-list');
      if (proyectosState.length === 0) {
        projContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-300 text-center py-4">No hay proyectos activos asignados.</p>';
      } else {
        projContainer.innerHTML = proyectosState.map(p => {
          const note = (p.calificaciones && p.calificaciones[alumno.uuid]) ? p.calificaciones[alumno.uuid] : 10;
          const camposBadges = (p.campos || []).map(c => `
            <span class="text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60">${c}</span>
          `).join(' ');

          return `
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex flex-wrap gap-1">${camposBadges}</div>
                <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md shrink-0 border border-emerald-100 dark:border-emerald-800/60">Nota: ${note}</span>
              </div>
              <h4 class="font-bold text-slate-900 dark:text-slate-100 text-xs">${p.titulo}</h4>
              <p class="text-[11px] text-slate-600 dark:text-slate-200 leading-relaxed">${p.desc}</p>
              <div class="text-[10px] text-slate-500 dark:text-slate-300 flex items-center justify-between pt-1">
                <span>Entrega: ${p.fecha}</span>
                <span class="text-indigo-600 dark:text-indigo-300 font-semibold">Proyecto Integrador</span>
              </div>
            </div>
          `;
        }).join('');
      }

      // 5. Tareas Escolares
      const tareasContainer = document.getElementById('p-tareas-list');
      if (tareasState.length === 0) {
        tareasContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-300 text-center py-4">No hay tareas asignadas para casa.</p>';
      } else {
        tareasContainer.innerHTML = tareasState.map(t => {
          const note = (t.calificaciones && t.calificaciones[alumno.uuid]) ? t.calificaciones[alumno.uuid] : 9;
          const camposBadges = (t.campos || []).map(c => `
            <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/60">${c}</span>
          `).join(' ');

          return `
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex flex-wrap gap-1">${camposBadges}</div>
                <span class="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md shrink-0 border border-indigo-100 dark:border-indigo-800/60">Nota: ${note}</span>
              </div>
              <h4 class="font-bold text-slate-900 dark:text-slate-100 text-xs">${t.titulo}</h4>
              <p class="text-[11px] text-slate-600 dark:text-slate-200 leading-relaxed">${t.desc}</p>
              <div class="text-[10px] text-slate-500 dark:text-slate-300 flex items-center justify-between pt-1">
                <span>Entrega: ${t.fecha}</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Tarea en Casa</span>
              </div>
            </div>
          `;
        }).join('');
      }

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

    // Modal Escáner QR de Padres
    function toggleParentScannerModal() {
      const modal = document.getElementById('modal-parent-scanner');
      if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        startParentQrCamera();
      } else {
        modal.classList.add('hidden');
        stopParentQrCamera();
      }
      lucide.createIcons();
    }

    async function startParentQrCamera() {
      isParentCameraActive = true;
      const placeholder = document.getElementById('parent-scanner-placeholder');
      placeholder.classList.add('hidden');

      try {
        parentHtml5QrScannerInstance = new Html5Qrcode("parent-qr-reader");
        const scanConfig = { fps: 12, qrbox: { width: 200, height: 200 } };
        const onScanSuccess = (decodedText) => {
          toggleParentScannerModal();
          openParentPortalByUuid(decodedText);
        };

        await startScannerForcingBackCamera(parentHtml5QrScannerInstance, scanConfig, onScanSuccess);
      } catch (e) {
        placeholder.classList.remove('hidden');
        showToast("No se pudo iniciar la cámara trasera.", "error");
        isParentCameraActive = false;
      }
    }

    function stopParentQrCamera() {
      if (parentHtml5QrScannerInstance) {
        parentHtml5QrScannerInstance.stop().then(() => parentHtml5QrScannerInstance.clear()).catch(() => {});
      }
      isParentCameraActive = false;
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
      placeholder.classList.add('hidden');
      isCameraActive = true;
      btnText.textContent = "Detener Cámara Trasera";

      try {
        html5QrScannerInstance = new Html5Qrcode("qr-reader");
        const scanConfig = { fps: 12, qrbox: { width: 190, height: 190 } };
        const onScanSuccess = (decodedText) => handleAttendanceScan(decodedText);

        await startScannerForcingBackCamera(html5QrScannerInstance, scanConfig, onScanSuccess);
      } catch (e) {
        showToast("No se pudo iniciar la cámara trasera.", "error");
        stopQrCamera();
      }
    }

    function stopQrCamera() {
      if (html5QrScannerInstance) {
        html5QrScannerInstance.stop().then(() => html5QrScannerInstance.clear()).catch(() => {});
      }
      document.getElementById('scanner-placeholder').classList.remove('hidden');
      document.getElementById('btn-camera-text').textContent = "Activar Cámara Trasera";
      isCameraActive = false;
    }

    function handleManualScan() {
      const input = document.getElementById('manual-scan-input');
      const val = input.value.trim();
      if (!val) return;
      handleAttendanceScan(val);
      input.value = '';
    }

    function handleAttendanceScan(scannedCode) {
      const q = (scannedCode || '').toLowerCase().trim();
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
      a.asistenciaHoy = 'presente';
      a.horaAsistencia = timeStr;
      if (!a.asistenciasTotales) a.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
      a.asistenciasTotales.presentes += 1;

      document.getElementById('last-scan-name').textContent = a.nombre;
      document.getElementById('last-scan-meta').textContent = `Hora: ${timeStr} • A tiempo`;
      document.getElementById('last-scan-feedback').classList.remove('hidden');

      showToast(`Asistencia confirmada: ${a.nombre}`, "success");
      updateTeacherViews();
    }

    function markAllAttendance(status) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      alumnosState.forEach(a => {
        a.asistenciaHoy = status;
        a.horaAsistencia = status === 'presente' ? timeStr : '--:--';
        if (!a.asistenciasTotales) a.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
        if (status === 'presente') a.asistenciasTotales.presentes += 1;
      });
      updateTeacherViews();
      showToast("Todos marcados como presentes", "success");
    }

    function setAlumnoAttendance(uuid, status) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;
      a.asistenciaHoy = status;
      a.horaAsistencia = (status === 'presente' || status === 'retardo') ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
      updateTeacherViews();
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
      alumno.asistenciaHoy = 'presente';
      alumno.horaAsistencia = `${timeStr} (Justificado)`;
      if (!alumno.asistenciasTotales) alumno.asistenciasTotales = { presentes: 0, retardos: 0, faltas: 0 };
      alumno.asistenciasTotales.presentes += 1;

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

      updateTeacherViews();
      showToast(`Falta de ${alumno.nombre} registrada como justificada`, "success");
    }

    function handleTeacherSendReply(e) {
      e.preventDefault();
      const input = document.getElementById('teacher-reply-input');
      const text = input.value.trim();
      if (!text) return;

      const th = mensajesState.find(x => x.id === selectedThreadId);
      if (!th) return;

      const now = new Date();
      const fechaStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      th.mensajes.push({
        remitente: 'maestro',
        autor: maestroState.nombre,
        texto: text,
        fecha: fechaStr
      });

      th.leidoPorMaestro = true;
      saveState();
      input.value = '';

      renderTeacherSelectedThread();
      renderTeacherMessagesThreads();
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
    function handleParentSendMessage(e) {
      e.preventDefault();
      if (!currentParentStudent) return;

      const asunto = document.getElementById('p_msg_asunto').value;
      const input = document.getElementById('p_msg_texto');
      const texto = input.value.trim();
      if (!texto) return;

      const now = new Date();
      const fechaStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // Buscar si ya existe un hilo de este alumno con ese asunto, o crear uno nuevo
      let thread = mensajesState.find(m => m.alumnoUuid === currentParentStudent.uuid && m.asunto === asunto);

      if (thread) {
        thread.leidoPorMaestro = false;
        thread.mensajes.push({
          remitente: 'padre',
          autor: `${currentParentStudent.tutor} (Tutor)`,
          texto: texto,
          fecha: fechaStr
        });
      } else {
        thread = {
          id: Date.now(),
          alumnoUuid: currentParentStudent.uuid,
          asunto: asunto,
          leidoPorMaestro: false,
          mensajes: [
            {
              remitente: 'padre',
              autor: `${currentParentStudent.tutor} (Tutor)`,
              texto: texto,
              fecha: fechaStr
            }
          ]
        };
        mensajesState.unshift(thread);
      }

      saveState();
      input.value = '';
      renderParentChatHistory(currentParentStudent.uuid);
      updateUnreadBadges();
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
    // 8. REPORTE DE EVALUACIÓN & PROMEDIOS REDONDEADOS
    // ==========================================================
    function handleSaveConfiguracion(e) {
      e.preventDefault();
      maestroState.nombre = document.getElementById('config_nombre').value.trim();
      maestroState.correo = document.getElementById('config_correo').value.trim();
      
      const gradoConfig = document.getElementById('config_grado_sel')?.value;
      const grupoConfig = document.getElementById('config_grupo_sel')?.value;
      if (gradoConfig && grupoConfig) {
        maestroState.grupo = `${gradoConfig} ${grupoConfig}`;
      } else {
        const configGrupo = document.getElementById('config_grupo');
        if (configGrupo) maestroState.grupo = configGrupo.value.trim();
      }

      maestroState.colegio = document.getElementById('config_colegio').value.trim();
      maestroState.ciclo = document.getElementById('config_ciclo').value.trim();

      const maxInput = document.getElementById('config_max_alumnos');
      if (maxInput) {
        const val = parseInt(maxInput.value, 10);
        if (!isNaN(val) && val > 0) {
          maestroState.maxAlumnos = val;
        }
      }

      updateTeacherViews();
      showToast("Configuración guardada correctamente", "success");
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
            const promA = materiasState.reduce((acc, m) => acc + (parseInt(a.calificaciones?.[m], 10) || 9), 0) / (materiasState.length || 1);
            const promB = materiasState.reduce((acc, m) => acc + (parseInt(b.calificaciones?.[m], 10) || 9), 0) / (materiasState.length || 1);
            valA = promA;
            valB = promB;
          } else {
            valA = parseInt(a.calificaciones?.[gradesSortCol], 10) || 9;
            valB = parseInt(b.calificaciones?.[gradesSortCol], 10) || 9;
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
          const rawVal = alumno.calificaciones[m] !== undefined ? alumno.calificaciones[m] : 9;
          const val = Math.round(parseFloat(rawVal) || 0);
          sum += val;
          count++;

          rowHtml += `
            <td class="px-3 py-2 text-center">
              <input
                type="number"
                step="1"
                min="0"
                max="10"
                value="${val}"
                oninput="updateDynamicGrade(${aIdx}, '${m}', this.value)"
                class="w-16 text-center py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </td>
          `;
        });

        const avgDecimal = count > 0 ? (sum / count).toFixed(1) : '10.0';
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
      let intVal = parseInt(value, 10);
      if (isNaN(intVal)) intVal = 0;
      if (intVal > 10) intVal = 10;
      if (intVal < 0) intVal = 0;
      alumno.calificaciones[materia] = intVal;

      let sum = 0, count = 0;
      materiasState.forEach(m => {
        sum += (parseInt(alumno.calificaciones[m], 10) || 0);
        count++;
      });
      const avgDecimal = count > 0 ? (sum / count).toFixed(1) : '10.0';
      const el = document.getElementById(`prom-alumno-${alumnoIdx}`);
      if (el) el.textContent = avgDecimal;

      saveState();
    }

    function saveAllGrades() {
      saveState();
      showToast("¡Reporte de Evaluación guardado exitosamente!", "success");
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
    function openNewProjectModal() {
      document.getElementById('modal-new-project').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeNewProjectModal() {
      document.getElementById('modal-new-project').classList.add('hidden');
    }

    function handleCreateProject(e) {
      e.preventDefault();
      const checkboxes = document.querySelectorAll('input[name="proj_campo"]:checked');
      const selectedCampos = Array.from(checkboxes).map(cb => cb.value);

      if (selectedCampos.length === 0) {
        showToast("Selecciona al menos un Campo Formativo.", "error");
        return;
      }

      const nuevo = {
        id: Date.now(),
        titulo: document.getElementById('proj-title').value.trim(),
        campos: selectedCampos,
        fechaPub: document.getElementById('proj-pub-date').value,
        fecha: document.getElementById('proj-date').value,
        desc: document.getElementById('proj-desc').value.trim(),
        calificaciones: {}
      };

      proyectosState.push(nuevo);
      updateTeacherViews();
      closeNewProjectModal();
      document.getElementById('form-new-project').reset();
      showToast("Proyecto publicado con éxito", "success");
    }

    function renderProjectsGrid() {
      const container = document.getElementById('projects-grid');
      if (proyectosState.length === 0) {
        container.innerHTML = `<div class="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-8 flex flex-col items-center justify-center gap-3"><i data-lucide="folder-kanban" class="w-10 h-10 text-slate-300"></i><div class="text-center"><p class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay proyectos activos</p><p class="text-[11px] text-slate-400">Planifica el primer proyecto integrador.</p></div></div>`;
        return;
      }

      container.innerHTML = proyectosState.map((proj, idx) => {
        const camposBadges = (proj.campos || []).map(c => `
          <span class="text-[9px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded-md border border-brand-100">${c}</span>
        `).join(' ');

        const pubText = proj.fechaPub ? `Pub: ${proj.fechaPub}` : 'Publicado';
        const isPendingReview = new Date(proj.fecha) < new Date();
        const pendingBadge = isPendingReview ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400">Revisión Pendiente</span>` : '';

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4 relative">
            <div>
              <div class="flex flex-wrap gap-1 mb-2">${camposBadges}</div>
              <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">${proj.titulo}</h3>
              <p class="text-[10px] text-slate-400 mb-1">${pubText}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${proj.desc}</p>
            </div>
            <div class="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <span>Entrega: <strong class="text-slate-700 dark:text-slate-300">${proj.fecha}</strong></span>
                ${pendingBadge}
              </div>
              <button onclick="deleteProject(${idx})" class="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function deleteProject(index) {
      proyectosState.splice(index, 1);
      updateTeacherViews();
      showToast("Proyecto eliminado", "info");
    }

    function openNewTareaModal() {
      document.getElementById('modal-new-tarea').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeNewTareaModal() {
      document.getElementById('modal-new-tarea').classList.add('hidden');
    }

    function handleCreateTarea(e) {
      e.preventDefault();
      const checkboxes = document.querySelectorAll('input[name="tarea_campo"]:checked');
      const selectedCampos = Array.from(checkboxes).map(cb => cb.value);

      if (selectedCampos.length === 0) {
        showToast("Selecciona al menos un Campo Formativo.", "error");
        return;
      }

      const nueva = {
        id: Date.now(),
        titulo: document.getElementById('tarea-title').value.trim(),
        campos: selectedCampos,
        fechaPub: document.getElementById('tarea-pub-date').value,
        fecha: document.getElementById('tarea-date').value,
        desc: document.getElementById('tarea-desc').value.trim(),
        calificaciones: {}
      };

      tareasState.push(nueva);
      updateTeacherViews();
      closeNewTareaModal();
      document.getElementById('form-new-tarea').reset();
      showToast("Tarea asignada para casa", "success");
    }

    function renderTareasGrid() {
      const container = document.getElementById('tareas-grid');
      if (tareasState.length === 0) {
        container.innerHTML = `<div class="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-8 flex flex-col items-center justify-center gap-3"><i data-lucide="check-square" class="w-10 h-10 text-slate-300"></i><div class="text-center"><p class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay tareas asignadas</p><p class="text-[11px] text-slate-400">Crea la primera tarea escolar.</p></div></div>`;
        return;
      }

      container.innerHTML = tareasState.map((tarea, idx) => {
        const camposBadges = (tarea.campos || []).map(c => `
          <span class="text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md border border-indigo-100">${c}</span>
        `).join(' ');

        const pubText = tarea.fechaPub ? `Pub: ${tarea.fechaPub}` : 'Publicado';
        const isPendingReview = new Date(tarea.fecha) < new Date();
        const pendingBadge = isPendingReview ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400">Revisión Pendiente</span>` : '';

        return `
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4 relative">
            <div>
              <div class="flex flex-wrap gap-1 mb-2">${camposBadges}</div>
              <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">${tarea.titulo}</h3>
              <p class="text-[10px] text-slate-400 mb-1">${pubText}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${tarea.desc}</p>
            </div>
            <div class="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <span>Entrega: <strong class="text-slate-700 dark:text-slate-300">${tarea.fecha}</strong></span>
                ${pendingBadge}
              </div>
              <button onclick="deleteTarea(${idx})" class="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function deleteTarea(index) {
      tareasState.splice(index, 1);
      updateTeacherViews();
      showToast("Tarea eliminada", "info");
    }

    // ==========================================================
    // 9.5 CALENDARIO ESCOLAR
    // ==========================================================
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
    // 9.6 ANUNCIOS GENERALES (DOCENTE & FAMILIAS)
    // ==========================================================
    let anunciosState = JSON.parse(localStorage.getItem('lumni_anuncios')) || [
      {
        id: 1,
        fecha: '2026-08-25',
        titulo: 'Reunión de Padres de Familia',
        desc: 'El próximo viernes tendremos reunión general para entrega de resultados del primer bloque y acuerdos pedagógicos.'
      },
      {
        id: 2,
        fecha: '2026-08-20',
        titulo: 'Suspensión Oficial de Labores',
        desc: 'El próximo lunes no habrá clases por conmemoración del calendario cívico escolar.'
      }
    ];

    function renderTeacherAnunciosList() {
      const container = document.getElementById('dash-anuncios-list');
      if (!container) return;

      if (anunciosState.length === 0) {
        container.innerHTML = `<p class="text-slate-400 py-6 text-center text-xs">No hay avisos publicados. Publica uno con el botón "+ Nuevo Aviso".</p>`;
        return;
      }

      container.innerHTML = anunciosState.map((a, idx) => `
        <div class="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700/80 space-y-1 transition-all">
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-bold text-xs text-slate-900 dark:text-slate-100">${a.titulo}</h4>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[10px] text-slate-400 font-medium">${a.fecha}</span>
              <button onclick="deleteAnuncio(${idx})" class="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer" title="Eliminar aviso" aria-label="Eliminar aviso">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">${a.desc}</p>
        </div>
      `).join('');
      lucide.createIcons();
    }

    function openNewAnuncioModal() {
      const dateInput = document.getElementById('anuncio-fecha');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      document.getElementById('modal-new-anuncio').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeNewAnuncioModal() {
      document.getElementById('modal-new-anuncio').classList.add('hidden');
      document.getElementById('form-new-anuncio')?.reset();
    }

    function handleCreateAnuncio(e) {
      e.preventDefault();
      const titulo = document.getElementById('anuncio-titulo').value.trim();
      const fecha = document.getElementById('anuncio-fecha').value;
      const desc = document.getElementById('anuncio-desc').value.trim();

      anunciosState.unshift({
        id: Date.now(),
        fecha: fecha || new Date().toISOString().split('T')[0],
        titulo,
        desc
      });

      closeNewAnuncioModal();
      updateTeacherViews();
      showToast("Aviso escolar publicado exitosamente", "success");
    }

    function deleteAnuncio(idx) {
      if (!confirm("¿Deseas eliminar este aviso escolar?")) return;
      anunciosState.splice(idx, 1);
      updateTeacherViews();
      showToast("Aviso escolar eliminado", "info");
    }

    function renderAnunciosPadres() {
      const container = document.getElementById('p-anuncios-list');
      if (!container) return;

      if (anunciosState.length === 0) {
        container.innerHTML = '<p class="text-xs text-white/70">No hay avisos recientes en el tablero.</p>';
        return;
      }

      container.innerHTML = anunciosState.map(a => `
        <div class="bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-sm space-y-1">
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-bold text-sm text-white">${a.titulo}</h4>
            <span class="text-[10px] text-white/80 shrink-0 font-medium">${a.fecha}</span>
          </div>
          <p class="text-xs text-white/90 leading-relaxed">${a.desc}</p>
        </div>
      `).join('');
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
        const rawVal = student.calificaciones?.[m] !== undefined ? student.calificaciones[m] : 9;
        const val = Math.round(parseFloat(rawVal) || 0);
        sum += val;
        count++;
        let rating = 'Sobresaliente';
        if (val < 6) rating = 'Insuficiente';
        else if (val < 7.5) rating = 'Básico';
        else if (val < 9) rating = 'Satisfactorio';

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-2.5 font-semibold text-slate-900">${m}</td>
            <td class="px-4 py-2.5 text-center font-mono font-bold text-slate-800">${val}</td>
            <td class="px-4 py-2.5 text-center text-xs font-semibold ${val >= 9 ? 'text-emerald-700' : (val >= 7 ? 'text-indigo-700' : 'text-amber-700')}">${rating}</td>
          </tr>
        `;
      }).join('');

      const avg = count > 0 ? (sum / count) : 10;
      document.getElementById('boleta-final-average').textContent = avg.toFixed(1);
      let finalRating = 'Sobresaliente';
      if (avg < 6) finalRating = 'Insuficiente';
      else if (avg < 7.5) finalRating = 'Básico';
      else if (avg < 9) finalRating = 'Satisfactorio';
      document.getElementById('boleta-final-rating').textContent = finalRating;

      // Resumen de Asistencias
      const pres = student.asistenciasTotales?.presentes || (student.asistenciaHoy === 'presente' ? 1 : 0);
      const ret = student.asistenciasTotales?.retardos || (student.asistenciaHoy === 'retardo' ? 1 : 0);
      const falt = student.asistenciasTotales?.faltas || (student.asistenciaHoy === 'falta' ? 1 : 0);
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
        id_maestro: localStorage.getItem('currentTeacherId'),
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
          const res = await fetch('http://localhost:3000/api/alumnos/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al registrar alumno');
          }

          const data = await res.json();

          const nuevoAlumno = {
            uuid: data?.alumno?.uuid || ('alu-' + crypto.randomUUID()),
            nombres: nombres,
            primerApellido: paterno,
            segundoApellido: materno,
            nombre: nombre_completo,
            fechaNacimiento: fechaNac,
            sexo: sexo,
            curp: curp,
            tutor: tutor,
            telefono: telefono,
            suscripcion: 'activa',
            asistenciaHoy: 'pendiente',
            horaAsistencia: '--:--',
            asistenciasTotales: { presentes: 1, retardos: 0, faltas: 0 },
            calificaciones: {}
          };

          materiasState.forEach(m => nuevoAlumno.calificaciones[m] = 9);

          alumnosState.unshift(nuevoAlumno);
          updateTeacherViews();
          renderParentDemoChips();
          form.reset();
          showToast(`¡Alumno ${nuevoAlumno.nombre} inscrito exitosamente!`, "success");
          openQrModal(nuevoAlumno.uuid);
        } catch (err) {
          // Si el backend no está disponible, registrar en modo local
          const nuevoAlumno = {
            uuid: 'alu-' + crypto.randomUUID(),
            nombres: nombres,
            primerApellido: paterno,
            segundoApellido: materno,
            nombre: nombre_completo,
            fechaNacimiento: fechaNac,
            sexo: sexo,
            curp: curp,
            tutor: tutor,
            telefono: telefono,
            suscripcion: 'activa',
            asistenciaHoy: 'pendiente',
            horaAsistencia: '--:--',
            asistenciasTotales: { presentes: 1, retardos: 0, faltas: 0 },
            calificaciones: {}
          };

          materiasState.forEach(m => nuevoAlumno.calificaciones[m] = 9);

          alumnosState.unshift(nuevoAlumno);
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
            asistenciasTotales: { presentes: 1, retardos: 0, faltas: 0 },
            calificaciones: {}
          };
          // Inicializar materias
          materiasState.forEach(m => {
            newStudent.calificaciones[m] = row.calificaciones[m] !== undefined ? Math.round(Number(row.calificaciones[m])) : 9;
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
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
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
