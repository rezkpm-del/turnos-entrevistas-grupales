/**
 * TALENTO GASTRONÓMICO - GESTOR DE ENTREVISTAS GRUPALES
 * Simulación Supabase: candidatos en localStorage
 * Bloques de 30 minutos, cupo máximo de 6 personas por turno.
 */

(function () {
  'use strict';

  // Constantes del sistema
  const MAX_CAPACITY = 6;
  const STORAGE_KEY = 'supabase_mock_candidates_db';
  const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30'
  ];

  // Estado local del candidato en registro activo
  let candidateDraft = {
    dni: '',
    full_name: '',
    age: '',
    role: '',
    photo_url: '',
    interview_date: '',
    interview_time: ''
  };

  let videoStream = null;

  // Referencias DOM
  const tabCandidate = document.getElementById('tab-candidate');
  const tabAdmin = document.getElementById('tab-admin');
  const candidateView = document.getElementById('candidate-view');
  const adminView = document.getElementById('admin-view');

  // Pasos Candidato
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');
  const stepSuccess = document.getElementById('step-success');

  const stepIndicators = document.querySelectorAll('.step-indicator');
  const formCandidate = document.getElementById('form-candidate-data');

  // Cámara
  const videoEl = document.getElementById('webcam-video');
  const canvasEl = document.getElementById('webcam-canvas');
  const photoPreviewBox = document.getElementById('photo-preview-box');
  const cameraGuide = document.getElementById('camera-guide');
  const cameraStatusMsg = document.getElementById('camera-status-msg');
  const btnSnapPhoto = document.getElementById('btn-snap-photo');
  const btnRetakePhoto = document.getElementById('btn-retake-photo');
  const btnSimAvatar = document.getElementById('btn-sim-avatar');
  const btnBackStep1 = document.getElementById('btn-back-step-1');
  const btnToStep3 = document.getElementById('btn-to-step-3');

  // Turno
  const candidateDatePicker = document.getElementById('candidate-date-picker');
  const candidateSlotsGrid = document.getElementById('candidate-slots-grid');
  const slotSelectionSummary = document.getElementById('slot-selection-summary');
  const selectedSlotText = document.getElementById('selected-slot-text');
  const selectedSlotCapacity = document.getElementById('selected-slot-capacity');
  const btnBackStep2 = document.getElementById('btn-back-step-2');
  const btnConfirmRegistration = document.getElementById('btn-confirm-registration');
  const successTicketSummary = document.getElementById('success-ticket-summary');
  const btnNewRegistration = document.getElementById('btn-new-registration');

  // Admin
  const adminDatePicker = document.getElementById('admin-date-picker');
  const adminTimeSelect = document.getElementById('admin-time-select');
  const adminCurrentCount = document.getElementById('admin-current-count');
  const meetingHeaderTitle = document.getElementById('meeting-header-title');
  const meetingHeaderSub = document.getElementById('meeting-header-sub');
  const adminCandidatesGrid = document.getElementById('admin-candidates-grid');
  const btnQuickSampleFill = document.getElementById('btn-quick-sample-fill');
  const btnResetDb = document.getElementById('btn-reset-db');
  const toastEl = document.getElementById('toast');

  // ====================================================
  // REPOSITORIO MOCK TIPO SUPABASE
  // Columnas: id, dni, full_name, age, role, photo_url, interview_date, interview_time, notes, created_at
  // ====================================================
  const SupabaseMock = {
    getAllCandidates: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          const seed = SupabaseMock.getSeedData();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          return seed;
        }
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error leyendo base local:', e);
        return [];
      }
    },

    saveCandidates: function (arr) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    },

    // SELECT count(*) WHERE interview_date = ? AND interview_time = ?
    countRegistered: function (date, time) {
      const all = SupabaseMock.getAllCandidates();
      return all.filter(c => c.interview_date === date && c.interview_time === time).length;
    },

    // INSERT INTO candidates (...)
    insertCandidate: function (candidateData) {
      const currentCount = SupabaseMock.countRegistered(candidateData.interview_date, candidateData.interview_time);
      if (currentCount >= MAX_CAPACITY) {
        throw new Error('El bloque horario ya no cuenta con vacantes disponibles.');
      }
      const all = SupabaseMock.getAllCandidates();
      const newRecord = {
        id: 'cnd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        dni: candidateData.dni,
        full_name: candidateData.full_name,
        age: parseInt(candidateData.age, 10),
        role: candidateData.role,
        photo_url: candidateData.photo_url || SupabaseMock.generateAvatarSvg(candidateData.full_name),
        interview_date: candidateData.interview_date,
        interview_time: candidateData.interview_time,
        notes: candidateData.notes || '',
        created_at: new Date().toISOString()
      };
      all.push(newRecord);
      SupabaseMock.saveCandidates(all);
      return newRecord;
    },

    // UPDATE candidates SET notes = ? WHERE id = ?
    updateNotes: function (id, notes) {
      const all = SupabaseMock.getAllCandidates();
      const idx = all.findIndex(c => c.id === id);
      if (idx !== -1) {
        all[idx].notes = notes;
        SupabaseMock.saveCandidates(all);
        return true;
      }
      return false;
    },

    // Generador de imagen en canvas local (100% sin URLs ni dependencias externas)
    generateAvatarSvg: function (name) {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      const initials = (name || 'C')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      const hues = [210, 160, 280, 340, 45, 195];
      const hue = hues[(name ? name.length : 0) % hues.length];

      // Fondo
      ctx.fillStyle = `hsl(${hue}, 45%, 22%)`;
      ctx.fillRect(0, 0, 200, 250);

      // Rostro
      ctx.fillStyle = `hsl(${hue}, 60%, 45%)`;
      ctx.beginPath();
      ctx.arc(100, 95, 48, 0, Math.PI * 2);
      ctx.fill();

      // Hombros
      ctx.fillStyle = `hsl(${hue}, 55%, 35%)`;
      ctx.beginPath();
      ctx.ellipse(100, 240, 80, 55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Iniciales
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials || 'C', 100, 95);

      return canvas.toDataURL('image/png');
    },

    getSeedData: function () {
      const todayStr = getTodayString();
      return [
        {
          id: 'cnd_seed_1',
          dni: '39485120',
          full_name: 'Santiago Morales',
          age: 26,
          role: 'Barista',
          photo_url: SupabaseMock.generateAvatarSvg('Santiago Morales'),
          interview_date: todayStr,
          interview_time: '10:00',
          notes: 'Buena presencia. Tiene 2 años de experiencia en café de especialidad y manejo de máquina La Marzocco.',
          created_at: new Date().toISOString()
        },
        {
          id: 'cnd_seed_2',
          dni: '41203948',
          full_name: 'Camila Benítez',
          age: 23,
          role: 'Mozo',
          photo_url: SupabaseMock.generateAvatarSvg('Camila Benitez'),
          interview_date: todayStr,
          interview_time: '10:00',
          notes: 'Muy desenvuelta al hablar. Manejo de bandeja y comandas digitales.',
          created_at: new Date().toISOString()
        },
        {
          id: 'cnd_seed_3',
          dni: '36881920',
          full_name: 'Lucas Ferrero',
          age: 31,
          role: 'Pizzero',
          photo_url: SupabaseMock.generateAvatarSvg('Lucas Ferrero'),
          interview_date: todayStr,
          interview_time: '10:00',
          notes: 'Dominio de masa estilo napolitano y hornos de leña/gas.',
          created_at: new Date().toISOString()
        }
      ];
    }
  };

  // Helpers de Fecha
  function getTodayString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDateNicely(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove('is-hidden');
    setTimeout(() => {
      toastEl.classList.add('is-hidden');
    }, 2800);
  }

  // ====================================================
  // CAMBIO DE VISTAS (Candidatos vs Admin)
  // ====================================================
  function switchTab(viewName) {
    if (viewName === 'admin') {
      tabCandidate.classList.remove('active');
      tabAdmin.classList.add('active');
      candidateView.classList.remove('is-active');
      adminView.classList.add('is-active');
      stopCamera();
      renderAdminView();
      window.location.hash = 'admin';
    } else {
      tabAdmin.classList.remove('active');
      tabCandidate.classList.add('active');
      adminView.classList.remove('is-active');
      candidateView.classList.add('is-active');
      window.location.hash = '';
    }
  }

  tabCandidate.addEventListener('click', () => switchTab('candidate'));
  tabAdmin.addEventListener('click', () => switchTab('admin'));

  // Manejo de URL Hash inicial
  if (window.location.hash === '#admin') {
    switchTab('admin');
  }

  // ====================================================
  // FLUJO DE CANDIDATO: PASO 1 (DATOS)
  // ====================================================
  formCandidate.addEventListener('submit', function (e) {
    e.preventDefault();
    const dni = document.getElementById('candidate-dni').value.trim();
    const name = document.getElementById('candidate-name').value.trim();
    const age = document.getElementById('candidate-age').value.trim();
    const role = document.getElementById('candidate-role').value;

    if (!dni || dni.length < 6) {
      showToast('Por favor, ingresá un DNI válido.');
      return;
    }
    if (!name || name.length < 3) {
      showToast('Ingresá tu nombre y apellido completo.');
      return;
    }
    if (!age || parseInt(age, 10) < 18) {
      showToast('Debes ser mayor de 18 años para postularte.');
      return;
    }
    if (!role) {
      showToast('Seleccioná el puesto al que aspirás.');
      return;
    }

    candidateDraft.dni = dni;
    candidateDraft.full_name = name;
    candidateDraft.age = age;
    candidateDraft.role = role;

    goToStep(2);
  });

  // Navegación de Pasos
  function goToStep(stepNum) {
    [step1, step2, step3, stepSuccess].forEach(el => el.classList.remove('is-active'));
    stepIndicators.forEach(ind => {
      const n = parseInt(ind.getAttribute('data-step'), 10);
      ind.classList.remove('is-current', 'is-done');
      if (n === stepNum) ind.classList.add('is-current');
      if (n < stepNum) ind.classList.add('is-done');
    });

    if (stepNum === 1) {
      step1.classList.add('is-active');
      stopCamera();
    } else if (stepNum === 2) {
      step2.classList.add('is-active');
      initCamera();
    } else if (stepNum === 3) {
      step3.classList.add('is-active');
      stopCamera();
      renderCandidateSlots();
    } else if (stepNum === 4) {
      stepSuccess.classList.add('is-active');
      stopCamera();
    }
  }

  // ====================================================
  // FLUJO DE CANDIDATO: PASO 2 (CÁMARA / SELFIE)
  // ====================================================
  async function initCamera() {
    cameraStatusMsg.textContent = 'Iniciando cámara frontal...';
    cameraGuide.classList.remove('is-hidden');
    photoPreviewBox.classList.add('is-hidden');
    btnRetakePhoto.classList.add('is-hidden');
    btnSnapPhoto.classList.remove('is-hidden');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 800 } },
          audio: false
        });
        videoEl.srcObject = videoStream;
        cameraStatusMsg.textContent = 'Enfocá tu rostro dentro de la guía';
      } else {
        throw new Error('Sin soporte de getUserMedia');
      }
    } catch (err) {
      console.warn('No se pudo acceder a la cámara en vivo:', err);
      cameraStatusMsg.textContent = 'Cámara no disponible en este dispositivo. Podés usar un avatar demo.';
    }
  }

  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }
  }

  btnSnapPhoto.addEventListener('click', function () {
    if (!videoStream && !candidateDraft.photo_url) {
      // Si la cámara no inició, generar avatar simpático
      useSimulatedAvatar();
      return;
    }

    // Capturar frame desde el video al canvas
    const width = videoEl.videoWidth || 320;
    const height = videoEl.videoHeight || 400;
    canvasEl.width = width;
    canvasEl.height = height;
    const ctx = canvasEl.getContext('2d');

    // Voltear horizontal para coincidir con la vista espejo
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0, width, height);

    const photoDataUrl = canvasEl.toDataURL('image/jpeg', 0.85);
    candidateDraft.photo_url = photoDataUrl;

    // Mostrar preview
    photoPreviewBox.style.backgroundImage = `url("${photoDataUrl}")`;
    photoPreviewBox.classList.remove('is-hidden');
    cameraGuide.classList.add('is-hidden');
    btnSnapPhoto.classList.add('is-hidden');
    btnRetakePhoto.classList.remove('is-hidden');
    btnToStep3.removeAttribute('disabled');
    cameraStatusMsg.textContent = '¡Foto capturada con éxito!';
  });

  function useSimulatedAvatar() {
    const avatar = SupabaseMock.generateAvatarSvg(candidateDraft.full_name || 'Candidato');
    candidateDraft.photo_url = avatar;
    photoPreviewBox.style.backgroundImage = `url("${avatar}")`;
    photoPreviewBox.classList.remove('is-hidden');
    cameraGuide.classList.add('is-hidden');
    btnSnapPhoto.classList.add('is-hidden');
    btnRetakePhoto.classList.remove('is-hidden');
    btnToStep3.removeAttribute('disabled');
    cameraStatusMsg.textContent = 'Avatar ilustrativo cargado correctamente.';
  }

  btnSimAvatar.addEventListener('click', useSimulatedAvatar);

  btnRetakePhoto.addEventListener('click', function () {
    candidateDraft.photo_url = '';
    btnToStep3.setAttribute('disabled', 'true');
    initCamera();
  });

  btnBackStep1.addEventListener('click', () => goToStep(1));
  btnToStep3.addEventListener('click', () => goToStep(3));

  // ====================================================
  // FLUJO DE CANDIDATO: PASO 3 (FECHA, TURNOS Y CUPOS)
  // ====================================================
  candidateDatePicker.value = getTodayString();
  candidateDatePicker.min = getTodayString();

  candidateDatePicker.addEventListener('change', function () {
    candidateDraft.interview_time = '';
    slotSelectionSummary.classList.add('is-hidden');
    btnConfirmRegistration.setAttribute('disabled', 'true');
    renderCandidateSlots();
  });

  function renderCandidateSlots() {
    const chosenDate = candidateDatePicker.value || getTodayString();
    candidateDraft.interview_date = chosenDate;
    candidateSlotsGrid.innerHTML = '';

    TIME_SLOTS.forEach(time => {
      const count = SupabaseMock.countRegistered(chosenDate, time);
      const isFull = count >= MAX_CAPACITY;
      const isSelected = candidateDraft.interview_time === time;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `slot-radio-btn ${isFull ? 'is-full' : ''} ${isSelected ? 'is-selected' : ''}`;
      if (isFull) {
        btn.disabled = true;
      }

      btn.innerHTML = `
        <div class="slot-time-text">${time} hs</div>
        <div class="slot-badge-count">
          <span>${isFull ? 'Sin cupo' : (MAX_CAPACITY - count) + ' lugares'}</span>
          <span>${count}/${MAX_CAPACITY}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        if (isFull) return;
        candidateDraft.interview_time = time;
        document.querySelectorAll('.slot-radio-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        selectedSlotText.textContent = `${formatDateNicely(chosenDate)} a las ${time} hs`;
        selectedSlotCapacity.textContent = `Vacante disponible (${count + 1}/${MAX_CAPACITY})`;
        slotSelectionSummary.classList.remove('is-hidden');
        btnConfirmRegistration.removeAttribute('disabled');
      });

      candidateSlotsGrid.appendChild(btn);
    });
  }

  btnBackStep2.addEventListener('click', () => goToStep(2));

  btnConfirmRegistration.addEventListener('click', function () {
    if (!candidateDraft.interview_date || !candidateDraft.interview_time) {
      showToast('Seleccioná un bloque con cupo libre.');
      return;
    }

    try {
      const savedRecord = SupabaseMock.insertCandidate(candidateDraft);
      // Armar resumen en ticket de éxito
      successTicketSummary.innerHTML = `
        <div class="ticket-row">
          <span class="ticket-label">Postulante:</span>
          <span class="ticket-value">${savedRecord.full_name}</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">DNI:</span>
          <span class="ticket-value">${savedRecord.dni}</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Puesto:</span>
          <span class="ticket-value">${savedRecord.role}</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Fecha y Hora:</span>
          <span class="ticket-value">${formatDateNicely(savedRecord.interview_date)} - ${savedRecord.interview_time} hs</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Formato:</span>
          <span class="ticket-value">Entrevista Grupal Presencial</span>
        </div>
      `;

      showToast('¡Inscripción registrada con éxito!');
      goToStep(4);
    } catch (err) {
      showToast(err.message || 'Error al guardar la postulación');
      renderCandidateSlots();
    }
  });

  btnNewRegistration.addEventListener('click', function () {
    formCandidate.reset();
    candidateDraft = {
      dni: '',
      full_name: '',
      age: '',
      role: '',
      photo_url: '',
      interview_date: '',
      interview_time: ''
    };
    slotSelectionSummary.classList.add('is-hidden');
    btnConfirmRegistration.setAttribute('disabled', 'true');
    btnToStep3.setAttribute('disabled', 'true');
    goToStep(1);
  });

  // ====================================================
  // SECCIÓN 2: VISTA ADMIN (PANEL DEL ENTREVISTADOR)
  // ====================================================
  adminDatePicker.value = getTodayString();

  function populateAdminTimeSelect() {
    adminTimeSelect.innerHTML = '';
    TIME_SLOTS.forEach(time => {
      const opt = document.createElement('option');
      opt.value = time;
      opt.textContent = `${time} hs`;
      adminTimeSelect.appendChild(opt);
    });
    adminTimeSelect.value = '10:00'; // Bloque por defecto
  }
  populateAdminTimeSelect();

  adminDatePicker.addEventListener('change', renderAdminView);
  adminTimeSelect.addEventListener('change', renderAdminView);

  function renderAdminView() {
    const chosenDate = adminDatePicker.value || getTodayString();
    const chosenTime = adminTimeSelect.value || '10:00';

    const allCandidates = SupabaseMock.getAllCandidates();
    const sessionCandidates = allCandidates.filter(
      c => c.interview_date === chosenDate && c.interview_time === chosenTime
    );

    // Header de Estado
    meetingHeaderTitle.textContent = `Mesa Grupal: ${formatDateNicely(chosenDate)} a las ${chosenTime} hs`;
    meetingHeaderSub.textContent = `${sessionCandidates.length} de ${MAX_CAPACITY} candidatos en sala presencial`;
    adminCurrentCount.textContent = `${sessionCandidates.length} / ${MAX_CAPACITY}`;

    // Renderizado en grilla simultánea (hasta 6 tarjetas)
    adminCandidatesGrid.innerHTML = '';

    // 1) Tarjetas de candidatos inscritos
    sessionCandidates.forEach((cand, index) => {
      const card = document.createElement('article');
      card.className = 'candidate-card';
      card.id = `card-${cand.id}`;

      card.innerHTML = `
        <header class="candidate-card-header">
          <div class="candidate-avatar-slot" style="background-image: url('${cand.photo_url}')" title="Foto de ${cand.full_name}">
            ${!cand.photo_url ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' : ''}
          </div>
          <div class="candidate-meta">
            <div class="candidate-role-pill">${cand.role}</div>
            <h3 class="candidate-name" title="${cand.full_name}">${cand.full_name}</h3>
            <div class="candidate-details-row">
              <span><strong>DNI:</strong> ${cand.dni}</span>
              <span>&bull;</span>
              <span><strong>Edad:</strong> ${cand.age} años</span>
            </div>
          </div>
        </header>

        <div class="candidate-notes-body">
          <div class="notes-label-bar">
            <label class="notes-label" for="notes-${cand.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Notas de Entrevista en Vivo
            </label>
            <span class="notes-save-status" id="status-${cand.id}">Guardado ✓</span>
          </div>
          <textarea
            id="notes-${cand.id}"
            class="candidate-notes-textarea"
            placeholder="Anotar observaciones sobre actitud, experiencia, dicción, puntualidad, disponibilidad..."
          >${cand.notes || ''}</textarea>
        </div>

        <footer class="candidate-card-footer">
          <button type="button" class="btn btn-save-note" data-candid="${cand.id}">
            Guardar Notas
          </button>
        </footer>
      `;

      // Evento guardar nota individual
      const btnSave = card.querySelector('.btn-save-note');
      const textarea = card.querySelector(`#notes-${cand.id}`);
      const statusSpan = card.querySelector(`#status-${cand.id}`);

      btnSave.addEventListener('click', () => {
        const notesVal = textarea.value;
        SupabaseMock.updateNotes(cand.id, notesVal);
        statusSpan.classList.add('show');
        showToast(`Notas de ${cand.full_name} actualizadas.`);
        setTimeout(() => {
          statusSpan.classList.remove('show');
        }, 2200);
      });

      adminCandidatesGrid.appendChild(card);
    });

    // 2) Asientos libres hasta completar los 6 cupos máximos del bloque
    const emptySeatsCount = MAX_CAPACITY - sessionCandidates.length;
    for (let i = 0; i < emptySeatsCount; i++) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'empty-seat-card';
      emptyCard.innerHTML = `
        <div class="empty-seat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </div>
        <h4>Lugar Libre (${sessionCandidates.length + i + 1}/${MAX_CAPACITY})</h4>
        <p>Cupo vacante para este bloque de 30 minutos.</p>
      `;
      adminCandidatesGrid.appendChild(emptyCard);
    }
  }

  // Botones auxiliares demo en Admin
  btnQuickSampleFill.addEventListener('click', function () {
    const chosenDate = adminDatePicker.value || getTodayString();
    const chosenTime = adminTimeSelect.value || '10:00';
    const current = SupabaseMock.countRegistered(chosenDate, chosenTime);
    if (current >= MAX_CAPACITY) {
      showToast('Este bloque ya está completo con 6 personas.');
      return;
    }

    const samplePeople = [
      { dni: '37119283', name: 'Martín Paredes', age: 28, role: 'Encargado' },
      { dni: '40918231', name: 'Agustina Gómez', age: 22, role: 'Mozo' },
      { dni: '38112349', name: 'Franco Valenti', age: 29, role: 'Pizzero' },
      { dni: '42019284', name: 'Lucía Navarro', age: 24, role: 'Bachero' },
      { dni: '39982311', name: 'Rodrigo Méndez', age: 27, role: 'Barista' },
      { dni: '35198273', name: 'Esteban Costa', age: 34, role: 'Encargado' }
    ];

    const candidateToInsert = samplePeople[current % samplePeople.length];
    try {
      SupabaseMock.insertCandidate({
        dni: candidateToInsert.dni,
        full_name: candidateToInsert.name,
        age: candidateToInsert.age,
        role: candidateToInsert.role,
        photo_url: SupabaseMock.generateAvatarSvg(candidateToInsert.name),
        interview_date: chosenDate,
        interview_time: chosenTime,
        notes: 'Candidato de muestra incorporado a la sala.'
      });
      showToast(`Añadido ${candidateToInsert.name} a las ${chosenTime} hs.`);
      renderAdminView();
    } catch (e) {
      showToast(e.message);
    }
  });

  btnResetDb.addEventListener('click', function () {
    if (confirm('¿Restablecer datos a estado inicial de demostración?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderAdminView();
      showToast('Datos reiniciados con éxito.');
    }
  });

  // Inicialización
  goToStep(1);
})();