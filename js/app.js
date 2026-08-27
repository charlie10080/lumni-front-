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

    // Datos del Maestro & Suscripción Escolar Variable ($20 MXN por Alumno)
    const PRECIO_POR_ALUMNO = 20;

    let maestroState = JSON.parse(localStorage.getItem('lumni_maestro')) || {
      nombre: 'Prof. Carlos Mendoza Morales',
      correo: 'carlos.mendoza@colegio.edu.mx',
      grupo: '3er Grado Grupo B',
      colegio: 'Lumni',
      ciclo: '2026-2027',
      maxAlumnos: 30
    };
    if (!maestroState.maxAlumnos) maestroState.maxAlumnos = 30;

    function getMaxAlumnos() {
      return parseInt(maestroState.maxAlumnos, 10) || 30;
    }

    function getActiveAlumnosCount() {
      return alumnosState.filter(a => (a.suscripcion || 'activa') !== 'cancelada').length;
    }

    function handleSubscriptionSlider(val) {
      const num = parseInt(val, 10) || 1;
      maestroState.maxAlumnos = num;
      const numInput = document.getElementById('sub-number-input');
      if (numInput) numInput.value = num;
      const configMax = document.getElementById('config_max_alumnos');
      if (configMax) configMax.value = num;
      updateTeacherViews();
    }

    function handleSubscriptionNumberInput(val) {
      let num = parseInt(val, 10);
      if (isNaN(num) || num < 1) num = 1;
      if (num > 200) num = 200;
      maestroState.maxAlumnos = num;
      const slider = document.getElementById('sub-range-slider');
      if (slider) slider.value = Math.min(num, 60);
      const configMax = document.getElementById('config_max_alumnos');
      if (configMax) configMax.value = num;
      updateTeacherViews();
    }

    function adjustSubscriptionCount(delta) {
      let current = getMaxAlumnos();
      let next = Math.max(current + delta, 1);
      maestroState.maxAlumnos = next;
      const slider = document.getElementById('sub-range-slider');
      if (slider) slider.value = Math.min(next, 60);
      const numInput = document.getElementById('sub-number-input');
      if (numInput) numInput.value = next;
      const configMax = document.getElementById('config_max_alumnos');
      if (configMax) configMax.value = next;
      updateTeacherViews();
    }

    function setQuickMaxAlumnos(val) {
      const maxInput = document.getElementById('config_max_alumnos');
      if (maxInput) maxInput.value = val;
      const numInput = document.getElementById('sub-number-input');
      if (numInput) numInput.value = val;
      const slider = document.getElementById('sub-range-slider');
      if (slider) slider.value = Math.min(val, 60);
      maestroState.maxAlumnos = val;
      saveState();
      updateTeacherViews();
      showToast(`Cupo de suscripción ajustado a ${val} alumnos ($${val * PRECIO_POR_ALUMNO} MXN/mes)`, "success");
    }

    // Plantilla de Materias Dinámicas
    let materiasState = JSON.parse(localStorage.getItem('lumni_materias')) || [
      'Español',
      'Matemáticas',
      'Ciencias Naturales',
      'Historia'
    ];

    // Alumnos Registrados con Estado de Suscripción / Pago
    let alumnosState = JSON.parse(localStorage.getItem('lumni_alumnos')) || [
      {
        uuid: 'alu-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        nombre: 'Sofía Martínez Ruiz',
        tutor: 'Carmen Ruiz García',
        telefono: '+52 55 9876 5432',
        suscripcion: 'activa',
        asistenciaHoy: 'presente',
        horaAsistencia: '08:02 AM',
        asistenciasTotales: { presentes: 22, retardos: 1, faltas: 0 },
        calificaciones: { 'Español': 9.5, 'Matemáticas': 9.0, 'Ciencias Naturales': 10.0, 'Historia': 9.5 }
      },
      {
        uuid: 'alu-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        nombre: 'Mateo Hernández Vega',
        tutor: 'Roberto Hernández',
        telefono: '+52 55 4321 8765',
        suscripcion: 'activa',
        asistenciaHoy: 'presente',
        horaAsistencia: '08:15 AM',
        asistenciasTotales: { presentes: 20, retardos: 2, faltas: 1 },
        calificaciones: { 'Español': 8.8, 'Matemáticas': 8.5, 'Ciencias Naturales': 9.0, 'Historia': 8.5 }
      },
      {
        uuid: 'alu-5f6e7d8c-9b0a-1a2b-3c4d-5e6f7a8b9c0d',
        nombre: 'Valentina López Cruz',
        tutor: 'Laura Cruz Mendoza',
        telefono: '+52 55 6789 0123',
        suscripcion: 'activa',
        asistenciaHoy: 'pendiente',
        horaAsistencia: '--:--',
        asistenciasTotales: { presentes: 19, retardos: 0, faltas: 2 },
        calificaciones: { 'Español': 9.2, 'Matemáticas': 9.0, 'Ciencias Naturales': 9.5, 'Historia': 9.0 }
      }
    ];

    alumnosState.forEach(a => {
      if (!a.suscripcion) a.suscripcion = 'activa';
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

    const stateListeners = [];
    function subscribeToState(listener) {
      stateListeners.push(listener);
    }

    function notifyStateChange() {
      stateListeners.forEach(listener => listener());
    }

    function saveState() {
      localStorage.setItem('lumni_maestro', JSON.stringify(maestroState));
      localStorage.setItem('lumni_materias', JSON.stringify(materiasState));
      localStorage.setItem('lumni_alumnos', JSON.stringify(alumnosState));
      localStorage.setItem('lumni_proyectos', JSON.stringify(proyectosState));
      localStorage.setItem('lumni_tareas', JSON.stringify(tareasState));
      localStorage.setItem('lumni_mensajes', JSON.stringify(mensajesState));
      localStorage.setItem('lumni_reportes', JSON.stringify(reportesState));
      localStorage.setItem('lumni_anuncios', JSON.stringify(anunciosState));

      notifyStateChange();
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

    function showView(targetViewId, pushState = true) {
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

      if (pushState && window.history.pushState) {
        let path = '/';
        if(targetViewId === 'view-auth-maestro') path = '#/docente/auth';
        if(targetViewId === 'view-auth-padre') path = '#/familias/auth';
        if(targetViewId === 'view-portal-maestro') path = '#/docente/dashboard';
        if(targetViewId === 'view-portal-padres') path = '#/familias/portal';

        window.history.pushState({ view: targetViewId }, '', path);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.lucide) lucide.createIcons();
    }

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        showView(e.state.view, false);
      } else {
        showView('view-landing', false);
      }
    });

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

      withLoading(btn, () => {
        openTeacherDashboard();
        showToast(`¡Bienvenido de nuevo, ${maestroState.nombre}!`, "success");
      });
    }

    function handleTeacherRegisterSubmit(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');

      withLoading(btn, () => {
        maestroState.nombre = document.getElementById('reg_nombre').value.trim();
        maestroState.correo = document.getElementById('reg_correo').value.trim();
        maestroState.grupo = document.getElementById('reg_grupo').value.trim();
        saveState();

        openTeacherDashboard();
        showToast(`¡Registro completado! Bienvenido(a), ${maestroState.nombre}`, "success");
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
    // 4. FLUJO PADRE: ACCESO QR & VISTA INDEPENDIENTE
    // ==========================================================
    function handleParentSearchSubmit() {
      const input = document.getElementById('padre_search_input');
      const val = input.value.trim();
      if (!val) {
        showToast("Por favor ingresa el Código ID del alumno.", "error");
        return;
      }
      openParentPortalByUuid(val);
    }

    function openParentPortalByUuid(uuidQuery) {
      const q = uuidQuery.toLowerCase().trim();
      const alumno = alumnosState.find(a => a.uuid.toLowerCase() === q || a.uuid.toLowerCase().includes(q));

      if (!alumno) {
        showToast("Código ID no válido. Verifica la credencial del alumno.", "error");
        return;
      }

      if ((alumno.suscripcion || 'activa') === 'cancelada') {
        playScanChime('warning');
        alert(`⚠️ Cuenta Desactivada / Sin Pago\n\nEl acceso al portal escolar para ${alumno.nombre} se encuentra temporalmente desactivado por falta de pago de suscripción escolar ($20 MXN/mes).\n\nComunícate con el docente (${maestroState.nombre}) para reactivar el servicio.`);
        return;
      }

      playScanChime('success');
      if (isParentCameraActive) stopParentQrCamera();

      currentParentStudent = alumno;
      renderParentPortal(alumno);
      showView('view-portal-padres');
      showToast(`Reporte de Evaluación de ${alumno.nombre} cargado`, "success");
    }

    function renderParentPortal(alumno) {
      // 1. Datos del Alumno
      document.getElementById('p-avatar').textContent = alumno.nombre.charAt(0).toUpperCase();
      document.getElementById('p-nombre').textContent = alumno.nombre;
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

      // 3. Reporte de Evaluación (Redondeado Sin Decimales con Math.round)
      const matContainer = document.getElementById('p-materias-list');
      let sum = 0, count = 0;

      matContainer.innerHTML = materiasState.map(m => {
        const cal = (alumno.calificaciones && alumno.calificaciones[m] !== undefined) ? alumno.calificaciones[m] : 9.0;
        sum += parseFloat(cal);
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

      const avgRounded = count > 0 ? Math.round(sum / count) : 10;
      document.getElementById('p-promedio-general').textContent = `Promedio General: ${avgRounded}`;

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
    let cleanupParentScannerTrap = null;
    function toggleParentScannerModal() {
      const modal = document.getElementById('modal-parent-scanner');
      if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        startParentQrCamera();
        cleanupParentScannerTrap = trapFocus(modal);
      } else {
        modal.classList.add('hidden');
        stopParentQrCamera();
        if(cleanupParentScannerTrap) {
            cleanupParentScannerTrap();
            cleanupParentScannerTrap = null;
        }
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
        <button onclick="openParentPortalByUuid('${a.uuid}')" class="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold text-[11px] transition-all cursor-pointer">
          ${a.nombre.split(' ')[0]} (${a.uuid.substring(0, 8)}...)
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

    function handleAttendanceScan(scannedUuid) {
      const a = alumnosState.find(x => x.uuid.toLowerCase() === scannedUuid.toLowerCase() || x.uuid.includes(scannedUuid));
      if (!a) {
        playScanChime('error');
        showToast("Código QR no reconocido en el grupo.", "error");
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
      maestroState.grupo = document.getElementById('config_grupo').value.trim();
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
      const configGrupo = document.getElementById('config_grupo');
      if(configGrupo) configGrupo.value = maestroState.grupo;
      const configColegio = document.getElementById('config_colegio');
      if(configColegio) configColegio.value = maestroState.colegio || 'Lumni';
      const configCiclo = document.getElementById('config_ciclo');
      if(configCiclo) configCiclo.value = maestroState.ciclo || '2026-2027';

      const maxAlumnos = getMaxAlumnos();
      const configMaxInput = document.getElementById('config_max_alumnos');
      if (configMaxInput) configMaxInput.value = maxAlumnos;

      const subNumberInput = document.getElementById('sub-number-input');
      if (subNumberInput) subNumberInput.value = maxAlumnos;

      const subRangeSlider = document.getElementById('sub-range-slider');
      if (subRangeSlider) subRangeSlider.value = Math.min(maxAlumnos, 60);

      const subSliderBadge = document.getElementById('sub-slider-badge');
      if (subSliderBadge) subSliderBadge.textContent = `${maxAlumnos} alumnos`;

      const totalPrecioMensual = maxAlumnos * PRECIO_POR_ALUMNO;
      const subTotalPrecio = document.getElementById('sub-total-precio');
      if (subTotalPrecio) subTotalPrecio.textContent = `$${totalPrecioMensual.toLocaleString('es-MX')} MXN`;

      const activeCount = getActiveAlumnosCount();
      const totalEnrolled = alumnosState.length;
      const descartadosCount = Math.max(totalEnrolled - activeCount, 0);
      const percent = Math.min(Math.round((activeCount / maxAlumnos) * 100), 100);
      const disponibles = Math.max(maxAlumnos - activeCount, 0);

      document.getElementById('dash-count-current').textContent = activeCount;
      const dashCountMax = document.getElementById('dash-count-max');
      if (dashCountMax) dashCountMax.textContent = maxAlumnos;
      document.getElementById('dash-limit-percent').textContent = `${percent}%`;
      document.getElementById('dash-disponibles-txt').textContent = disponibles;

      const cupoDispTab = document.getElementById('cupo-disponible-tab');
      if (cupoDispTab) cupoDispTab.textContent = disponibles;
      const cupoMaxTab = document.getElementById('cupo-max-tab');
      if (cupoMaxTab) cupoMaxTab.textContent = maxAlumnos;

      document.getElementById('tabla-total-badge').textContent = `${totalEnrolled} Alumnos (${activeCount} que pagan • $${activeCount * PRECIO_POR_ALUMNO} MXN)`;
      document.getElementById('sidebar-capacidad-txt').textContent = `${activeCount} / ${maxAlumnos}`;

      // Actualizar tarjeta de plan en Configuración
      const planCupoBadge = document.getElementById('plan-cupo-badge');
      if (planCupoBadge) planCupoBadge.textContent = `${maxAlumnos} Alumnos ($${totalPrecioMensual} MXN)`;
      const planCupoTotal = document.getElementById('plan-cupo-total');
      if (planCupoTotal) planCupoTotal.textContent = maxAlumnos;
      const planActivosCount = document.getElementById('plan-activos-count');
      if (planActivosCount) planActivosCount.textContent = activeCount;
      const subStatActivosPesos = document.getElementById('sub-stat-activos-pesos');
      if (subStatActivosPesos) subStatActivosPesos.textContent = `$${activeCount * PRECIO_POR_ALUMNO} MXN/mes`;
      const subStatDescartados = document.getElementById('sub-stat-descartados');
      if (subStatDescartados) subStatDescartados.textContent = descartadosCount;

      // Footer
      const footerNum = document.getElementById('footer-capacidad-num');
      if (footerNum) footerNum.textContent = `${maxAlumnos} Alumnos ($${totalPrecioMensual} MXN/mes)`;

      const progressBar = document.getElementById('dash-progress-bar');
      progressBar.style.width = `${percent}%`;
      if (percent >= 90) progressBar.className = "h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500";
      else if (percent >= 70) progressBar.className = "h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500";
      else progressBar.className = "h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-500";

      const sidebarBar = document.getElementById('sidebar-progress-bar');
      if (sidebarBar) sidebarBar.style.width = `${percent}%`;

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
      headersHtml += `<th class="px-4 py-3 text-center cursor-pointer select-none" onclick="sortGrades('promedio')">Promedio (Entero) ${getSortIcon('promedio')}</th>`;
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
            const promA = materiasState.reduce((acc, m) => acc + (parseFloat(a.calificaciones?.[m]) || 9.0), 0) / (materiasState.length || 1);
            const promB = materiasState.reduce((acc, m) => acc + (parseFloat(b.calificaciones?.[m]) || 9.0), 0) / (materiasState.length || 1);
            valA = Math.round(promA);
            valB = Math.round(promB);
          } else {
            valA = parseFloat(a.calificaciones?.[gradesSortCol]) || 9.0;
            valB = parseFloat(b.calificaciones?.[gradesSortCol]) || 9.0;
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
          const val = alumno.calificaciones[m] !== undefined ? alumno.calificaciones[m] : 9.0;
          sum += parseFloat(val) || 0;
          count++;

          rowHtml += `
            <td class="px-3 py-2 text-center">
              <input
                type="number"
                step="0.1"
                min="5"
                max="10"
                value="${val}"
                onchange="updateDynamicGrade(${aIdx}, '${m}', this.value)"
                class="w-16 text-center py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </td>
          `;
        });

        const promRounded = count > 0 ? Math.round(sum / count) : 10;
        rowHtml += `
          <td class="px-4 py-3 text-center font-extrabold text-brand-600 dark:text-brand-400 text-sm" id="prom-alumno-${aIdx}">
            ${promRounded}
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
      if (!alumno.calificaciones) alumno.calificaciones = {};
      alumno.calificaciones[materia] = parseFloat(value) || 0;

      let sum = 0, count = 0;
      materiasState.forEach(m => {
        sum += parseFloat(alumno.calificaciones[m]) || 0;
        count++;
      });
      const promRounded = count > 0 ? Math.round(sum / count) : 10;
      const el = document.getElementById(`prom-alumno-${alumnoIdx}`);
      if (el) el.textContent = promRounded;

      saveState();
    }

    function saveAllGrades() {
      saveState();
      showToast("¡Reporte de Evaluación guardado exitosamente!", "success");
    }

    let cleanupMateriasTrap = null;
    function openMateriasModal() {
      renderMateriasModalList();
      const modal = document.getElementById('modal-materias');
      modal.classList.remove('hidden');
      cleanupMateriasTrap = trapFocus(modal);
      lucide.createIcons();
    }

    function closeMateriasModal() {
      document.getElementById('modal-materias').classList.add('hidden');
      if (cleanupMateriasTrap) {
          cleanupMateriasTrap();
          cleanupMateriasTrap = null;
      }
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
    let cleanupProjectTrap = null;
    function openNewProjectModal() {
      const modal = document.getElementById('modal-new-project');
      modal.classList.remove('hidden');
      cleanupProjectTrap = trapFocus(modal);
      lucide.createIcons();
    }

    function closeNewProjectModal() {
      document.getElementById('modal-new-project').classList.add('hidden');
      if (cleanupProjectTrap) {
          cleanupProjectTrap();
          cleanupProjectTrap = null;
      }
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

    let cleanupTareaTrap = null;
    function openNewTareaModal() {
      const modal = document.getElementById('modal-new-tarea');
      modal.classList.remove('hidden');
      cleanupTareaTrap = trapFocus(modal);
      lucide.createIcons();
    }

    function closeNewTareaModal() {
      document.getElementById('modal-new-tarea').classList.add('hidden');
      if (cleanupTareaTrap) {
          cleanupTareaTrap();
          cleanupTareaTrap = null;
      }
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

      // Calificaciones por Asignatura
      const tbody = document.getElementById('boleta-grades-tbody');
      let sum = 0;
      let count = 0;
      tbody.innerHTML = materiasState.map(m => {
        const val = student.calificaciones?.[m] !== undefined ? parseFloat(student.calificaciones[m]) : 9.0;
        sum += val;
        count++;
        let rating = 'Sobresaliente';
        if (val < 6) rating = 'Insuficiente';
        else if (val < 7.5) rating = 'Básico';
        else if (val < 9) rating = 'Satisfactorio';

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-2.5 font-semibold text-slate-900">${m}</td>
            <td class="px-4 py-2.5 text-center font-mono font-bold text-slate-800">${val.toFixed(1)}</td>
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
      const maxAlu = getMaxAlumnos();
      const activeCount = getActiveAlumnosCount();

      if (activeCount >= maxAlu) {
        showToast(`Límite de suscripción alcanzado (${activeCount}/${maxAlu} cupos ocupados). Amplía tu plan en Configuración o cancela a un alumno inactivo.`, "error");
        return;
      }

      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');

      withLoading(btn, () => {
        const nuevoAlumno = {
          uuid: 'alu-' + crypto.randomUUID(),
          nombre: document.getElementById('alumno_nombre').value.trim(),
          tutor: document.getElementById('alumno_tutor').value.trim(),
          telefono: document.getElementById('alumno_telefono').value.trim(),
          suscripcion: 'activa',
          asistenciaHoy: 'pendiente',
          horaAsistencia: '--:--',
          asistenciasTotales: { presentes: 1, retardos: 0, faltas: 0 },
          calificaciones: {}
        };

        materiasState.forEach(m => nuevoAlumno.calificaciones[m] = 9.0);

        alumnosState.unshift(nuevoAlumno);
        updateTeacherViews();
        renderParentDemoChips();
        form.reset();
        showToast("Alumno registrado con suscripción activa asignada", "success");
        openQrModal(nuevoAlumno.uuid);
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

    let currentAlumnosStatusFilter = 'todos';

    function setAlumnosFilter(status) {
      currentAlumnosStatusFilter = status;
      ['filter-alu-todos', 'filter-alu-activos', 'filter-alu-desactivados'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer";
      });

      const activeBtn = document.getElementById(`filter-alu-${status}`);
      if (activeBtn) {
        if (status === 'activa' || status === 'activos') {
          activeBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs transition-all cursor-pointer";
        } else if (status === 'desactivada' || status === 'desactivados') {
          activeBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs transition-all cursor-pointer";
        } else {
          activeBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-600 text-white shadow-xs transition-all cursor-pointer";
        }
      }

      filterAlumnosTable();
    }

    function toggleAlumnoSuscripcion(uuid) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;
      const current = a.suscripcion || 'activa';

      if (current !== 'cancelada') {
        a.suscripcion = 'cancelada';
        showToast(`Cuenta de ${a.nombre} desactivada (no se cobrarán $20 MXN)`, "info");
      } else {
        const maxAlu = getMaxAlumnos();
        const activeCount = getActiveAlumnosCount();
        if (activeCount >= maxAlu) {
          showToast(`Cupo de suscripción lleno (${maxAlu} alumnos). Aumenta tu cupo en Configuración para activar a ${a.nombre}.`, "error");
          return;
        }
        a.suscripcion = 'activa';
        showToast(`Cuenta de ${a.nombre} activada e incluida en la suscripción ($20 MXN/mes)`, "success");
      }

      updateTeacherViews();
    }

    function eliminarAlumnosDesactivados() {
      const noPagados = alumnosState.filter(a => (a.suscripcion || 'activa') === 'cancelada');
      if (noPagados.length === 0) {
        showToast("No hay alumnos desactivados o sin pago para quitar.", "info");
        return;
      }

      if (!confirm(`¿Deseas quitar y dar de baja definitivamente a los ${noPagados.length} alumnos que no han pagado?\n\nEsta acción eliminará sus registros locales.`)) {
        return;
      }

      const noPagadosUuids = noPagados.map(a => a.uuid);
      alumnosState = alumnosState.filter(a => !noPagadosUuids.includes(a.uuid));
      reportesState = reportesState.filter(r => !noPagadosUuids.includes(r.alumnoUuid));
      mensajesState = mensajesState.filter(m => !noPagadosUuids.includes(m.alumnoUuid));

      updateTeacherViews();
      renderParentDemoChips();
      showToast(`${noPagados.length} alumno(s) sin pago eliminados del sistema`, "success");
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
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8"><div class="flex flex-col items-center justify-center gap-2 text-slate-400"><i data-lucide="users" class="w-8 h-8 text-slate-300"></i><p class="text-sm font-semibold text-slate-500">No hay alumnos en esta vista</p><p class="text-[11px]">Inscribe un nuevo alumno o cambia el filtro de estado.</p></div></td></tr>`;
        return;
      }

      tbody.innerHTML = data.map(a => {
        const sub = a.suscripcion || 'activa';
        let subBadge = '';
        if (sub !== 'cancelada') {
          subBadge = `
            <button onclick="toggleAlumnoSuscripcion('${a.uuid}')" class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/70 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 flex items-center gap-1.5 transition-all cursor-pointer group" title="Click para desactivar cuenta y no pagar por este alumno">
              <span class="w-2 h-2 rounded-full bg-emerald-500 group-hover:bg-rose-500 transition-colors"></span>
              <span class="group-hover:hidden">🟢 Paga $20/mes</span>
              <span class="hidden group-hover:inline">🚫 Desactivar</span>
            </button>
          `;
        } else {
          subBadge = `
            <button onclick="toggleAlumnoSuscripcion('${a.uuid}')" class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-all cursor-pointer group" title="Click para reactivar cuenta e incluir en suscripción ($20 MXN/mes)">
              <span class="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-emerald-500 transition-colors"></span>
              <span class="group-hover:hidden">🔴 Desactivado ($0)</span>
              <span class="hidden group-hover:inline">⚡ Reactivar ($20)</span>
            </button>
          `;
        }

        return `
          <tr class="hover:bg-slate-50 dark:bg-slate-800 transition-colors block md:table-row border-b md:border-none border-slate-200 dark:border-slate-700/60 pb-3 md:pb-0 mb-3 md:mb-0">
            <td class="px-4 py-3 block md:table-cell">
              <div class="font-bold text-slate-900 dark:text-slate-100">${a.nombre}</div>
              <div class="text-[10px] text-slate-400 font-mono">${a.uuid.substring(0, 13)}...</div>
            </td>
            <td class="px-4 py-3 block md:table-cell">
              <div class="font-medium text-slate-800 dark:text-slate-200">${a.tutor}</div>
              <div class="text-[11px] text-slate-400">${a.telefono}</div>
            </td>
            <td class="px-4 py-3 block md:table-cell">
              ${subBadge}
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
        `;
      }).join('');
    }

    function filterAlumnosTable() {
      const q = document.getElementById('search-alumnos-input')?.value.toLowerCase().trim() || '';
      let res = [...alumnosState];

      // Filtro por Estado de Suscripción
      if (currentAlumnosStatusFilter === 'activos' || currentAlumnosStatusFilter === 'activa') {
        res = res.filter(a => (a.suscripcion || 'activa') !== 'cancelada');
      } else if (currentAlumnosStatusFilter === 'desactivados' || currentAlumnosStatusFilter === 'desactivada') {
        res = res.filter(a => (a.suscripcion || 'activa') === 'cancelada');
      }

      // Filtro por Búsqueda de Texto
      if (q) {
        res = res.filter(a => 
          a.nombre.toLowerCase().includes(q) || 
          a.tutor.toLowerCase().includes(q) || 
          a.telefono.toLowerCase().includes(q) || 
          a.uuid.toLowerCase().includes(q) ||
          (a.suscripcion || '').toLowerCase().includes(q)
        );
      }

      renderAlumnosTable(res);
      lucide.createIcons();
    }

    function deleteAlumno(uuid) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;
      const isPaid = (a.suscripcion || 'activa') !== 'cancelada';
      const msgExtra = isPaid ? "Se liberará 1 cupo de suscripción contratado." : "";
      if (!confirm(`¿Eliminar a ${a.nombre}? ${msgExtra}`)) return;

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
      document.getElementById('edit-alumno-nombre').value = a.nombre;
      document.getElementById('edit-alumno-tutor').value = a.tutor;
      document.getElementById('edit-alumno-tel').value = a.telefono;
      const subSelect = document.getElementById('edit-alumno-suscripcion');
      if (subSelect) subSelect.value = a.suscripcion || 'activa';

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

      const subSelect = document.getElementById('edit-alumno-suscripcion');
      const newSub = subSelect ? subSelect.value : (a.suscripcion || 'activa');

      // Si pasa de cancelada a activa/pausada, validar cupo disponible
      if ((a.suscripcion === 'cancelada') && (newSub !== 'cancelada')) {
        const maxAlu = getMaxAlumnos();
        const activeCount = getActiveAlumnosCount();
        if (activeCount >= maxAlu) {
          showToast(`No puedes activar a ${a.nombre}: límite de ${maxAlu} cupos alcanzado. Amplía tu plan en Configuración.`, "error");
          return;
        }
      }

      a.nombre = document.getElementById('edit-alumno-nombre').value.trim();
      a.tutor = document.getElementById('edit-alumno-tutor').value.trim();
      a.telefono = document.getElementById('edit-alumno-tel').value.trim();
      a.suscripcion = newSub;

      closeEditModal();
      updateTeacherViews();
      showToast("Datos y suscripción del alumno actualizados", "success");
    }

    function openQrModal(uuid) {
      const a = alumnosState.find(x => x.uuid === uuid);
      if (!a) return;

      currentActiveModalUuid = a.uuid;
      document.getElementById('qr-modal-student-name').textContent = a.nombre;
      document.getElementById('qr-modal-student-group').textContent = maestroState.grupo;
      document.getElementById('qr-modal-student-tutor').textContent = `Tutor: ${a.tutor}`;
      document.getElementById('qr-modal-uuid-txt').textContent = a.uuid;
      document.getElementById('qr-modal-school-name').textContent = `Lumni • ${maestroState.grupo}`;

      const container = document.getElementById('modal-qrcode-target');
      container.innerHTML = '';

      new QRCode(container, {
        text: a.uuid,
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
      let csv = "UUID,Nombre,Tutor,Telefono\n";
      alumnosState.forEach(a => {
        csv += `"${a.uuid}","${a.nombre}","${a.tutor}","${a.telefono}"\n`;
      });
      downloadCSV(csv, "alumnos_lumni.csv");
      showToast("Reporte de alumnos exportado", "success");
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
        let sum = 0;
        let row = `"${a.nombre}",`;
        materiasState.forEach(m => {
          const val = a.calificaciones?.[m] ?? 9.0;
          sum += parseFloat(val);
          row += `${val},`;
        });
        const prom = materiasState.length > 0 ? Math.round(sum / materiasState.length) : 10;
        row += `${prom}\n`;
        csv += row;
      });
      downloadCSV(csv, "calificaciones_lumni.csv");
      showToast("Reporte de calificaciones exportado", "success");
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
      document.getElementById('reg_grupo').value = maestroState.grupo;

      renderParentDemoChips();

      // Cuando el estado cambia y estamos en el dashboard del maestro, actualizamos la vista
      subscribeToState(() => {
        const portalMaestro = document.getElementById('view-portal-maestro');
        if (portalMaestro && !portalMaestro.classList.contains('hidden')) {
           // updateTeacherViews ya es llamado en muchas funciones explícitamente,
           // esto asegura que si agregamos nuevas funciones que solo hacen saveState(),
           // la UI se actualice.
           // Sin embargo, para evitar loops infinitos si updateTeacherViews llama saveState (sí lo hace),
           // lo mantenemos simple o refactorizamos updateTeacherViews.
           // *Nota:* updateTeacherViews() llama a saveState(). Lo omitiremos aquí
           // para evitar un bucle infinito en esta versión Vanilla JS simplificada.
        }
      });

      // INICIA EN LA LANDING
      const hash = window.location.hash;
      if (hash.includes('/docente/auth')) showView('view-auth-maestro', false);
      else if (hash.includes('/familias/auth')) showView('view-auth-padre', false);
      else if (hash.includes('/docente/dashboard')) showView('view-portal-maestro', false);
      else if (hash.includes('/familias/portal')) showView('view-portal-padres', false);
      else showView('view-landing', false);
    });
