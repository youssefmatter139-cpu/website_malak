(() => {
  const $ = (id) => document.getElementById(id);
  const lockScreen = $('lockScreen');
  const mainSite = $('mainSite');
  const day = $('birthDay'), month = $('birthMonth'), year = $('birthYear');
  const lockMessage = $('lockMessage');
  const toast = $('toast');
  let toastTimer;

  // Convert Arabic-Indic digits (٠-٩) and Persian digits (۰-۹) to standard ASCII (0-9)
  function toAsciiDigits(str) {
    if (!str) return '';
    return String(str)
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function formatInput(input, max, next) {
    input.value = toAsciiDigits(input.value).replace(/\D/g, '').slice(0, max);
    if (input.value.length === max && next) next.focus();
  }

  day.addEventListener('input', () => formatInput(day, 2, month));
  month.addEventListener('input', () => formatInput(month, 2, year));
  year.addEventListener('input', () => formatInput(year, 4, null));

  // Mobile-friendly keyboard navigation (Backspace & arrows)
  day.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === '/') {
      e.preventDefault();
      month.focus();
    }
  });

  month.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === '/') {
      e.preventDefault();
      year.focus();
    } else if (e.key === 'Backspace' && !month.value) {
      day.focus();
    } else if (e.key === 'ArrowLeft' && month.selectionStart === 0) {
      day.focus();
    }
  });

  year.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !year.value) {
      month.focus();
    } else if (e.key === 'ArrowLeft' && year.selectionStart === 0) {
      month.focus();
    }
  });

  // Support pasting full dates (e.g. "28/01/2026", "28-01-2026", "28012026")
  [day, month, year].forEach(input => {
    input.addEventListener('paste', e => {
      const paste = (e.clipboardData || window.clipboardData)?.getData('text');
      if (!paste) return;
      const clean = toAsciiDigits(paste).replace(/\D/g, '');
      if (clean.length >= 8) {
        e.preventDefault();
        day.value = clean.slice(0, 2);
        month.value = clean.slice(2, 4);
        year.value = clean.slice(4, 8);
        year.focus();
      }
    });
  });

  function unlock() {
    // Dismiss mobile virtual keyboard
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    document.body.classList.remove('locked');
    lockScreen.classList.add('unlocked');
    mainSite.removeAttribute('inert');
    mainSite.inert = false;
    mainSite.classList.add('visible');

    const burstCount = window.innerWidth < 640 ? 65 : 140;
    burst(window.innerWidth / 2, window.innerHeight / 2, burstCount);
    setTimeout(() => {
      lockScreen.hidden = true;
      $('home').scrollIntoView({ behavior: 'smooth' });
    }, 850);
    showToast('Unlocked with love 💖 Happy Birthday, Malak!');
  }

  $('birthdateForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = toAsciiDigits(day.value).padStart(2, '0');
    const m = toAsciiDigits(month.value).padStart(2, '0');
    const y = toAsciiDigits(year.value);
    const entered = `${d}/${m}/${y}`;

    // Birthday passcode
    if (entered === '28/01/2026') {
      lockMessage.textContent = 'A little magic is on its way… 💗';
      lockMessage.classList.remove('error');
      unlock();
    } else {
      lockMessage.textContent = 'Not quite, sweetheart. Try 28 / 01 / 2026 💌';
      lockMessage.classList.add('error');
      burst(window.innerWidth / 2, window.innerHeight / 2, 16);
    }
  });

  $('envelope').addEventListener('click', () => {
    const opening = !$('envelope').classList.contains('open');
    $('envelope').classList.toggle('open', opening);
    $('letterContent').classList.toggle('open', opening);
    $('readMoreBtn').textContent = opening ? 'Close Letter 💌' : 'Read More 💌';
  });

  $('readMoreBtn').addEventListener('click', () => {
    const content = $('letterContent');
    const opening = !content.classList.contains('open');
    content.classList.toggle('open', opening);
    $('envelope').classList.toggle('open', opening);
    $('readMoreBtn').textContent = opening ? 'Close Letter 💌' : 'Read More 💌';
    if (opening) content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // ========================================================
  // REAL 3D BOOK ENGINE (Synthesized paper sound, page turns, swipe)
  // ========================================================
  function playPaperSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const duration = 0.13;
      const sampleRate = ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const progress = i / bufferSize;
        const decay = Math.exp(-progress * 4.8);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1700;
      filter.Q.value = 1.3;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (err) {}
  }

  const scrapbookEl = $('scrapbook');
  const bookPagesContainer = $('bookPages');
  const pageLabel = $('pageLabel');
  const pageDotsContainer = $('pageDots');
  const prevBtn = $('prevPage');
  const nextBtn = $('nextPage');

  let currentPageIndex = 0;
  let isFlipping = false;

  function getPages() {
    return Array.from(bookPagesContainer.querySelectorAll('.book-page'));
  }

  function renderDots(total, current) {
    if (!pageDotsContainer) return;
    pageDotsContainer.innerHTML = '';

    // For albums with many pages (like our 41 pages), render an elegant smooth progress track
    if (total > 12) {
      const progressTrack = document.createElement('div');
      progressTrack.className = 'book-progress-track';
      const progressFill = document.createElement('div');
      progressFill.className = 'book-progress-fill';
      const pct = total <= 1 ? 100 : (current / (total - 1)) * 100;
      progressFill.style.width = `${pct}%`;
      progressTrack.appendChild(progressFill);
      pageDotsContainer.appendChild(progressTrack);
      return;
    }

    for (let i = 0; i < total; i++) {
      const dot = document.createElement('span');
      dot.className = `dot ${i === current ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Page ${i + 1}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isFlipping || i === currentPageIndex) return;
        updatePageUI(i, i > currentPageIndex ? 1 : -1);
      });
      pageDotsContainer.appendChild(dot);
    }
  }

  function updatePageUI(targetIndex, direction = 0) {
    const pages = getPages();
    const total = pages.length;
    if (total === 0) return;

    targetIndex = Math.max(0, Math.min(targetIndex, total - 1));
    const fromIndex = currentPageIndex;

    if (direction !== 0 && targetIndex !== fromIndex) {
      isFlipping = true;
      playPaperSound();

      if (direction > 0) {
        // Turning Next: current page curls and flips left to reveal the one underneath
        const outgoing = pages[fromIndex];
        const incoming = pages[targetIndex];

        incoming.className = 'book-page active page-under';
        outgoing.className = 'book-page active flipping-next';

        setTimeout(() => {
          outgoing.className = 'book-page turned';
          incoming.className = 'book-page active';
          isFlipping = false;
        }, 620);
      } else {
        // Turning Prev: past page uncurls from left back over the current page
        const outgoing = pages[fromIndex];
        const incoming = pages[targetIndex];

        outgoing.className = 'book-page page-under';
        incoming.className = 'book-page turned flipping-prev';

        setTimeout(() => {
          outgoing.className = 'book-page';
          incoming.className = 'book-page active';
          isFlipping = false;
        }, 620);
      }
    } else {
      // Snap to target without animation
      pages.forEach((p, idx) => {
        if (idx < targetIndex) p.className = 'book-page turned';
        else if (idx === targetIndex) p.className = 'book-page active';
        else p.className = 'book-page';
      });
    }

    currentPageIndex = targetIndex;

    // Update label: "MEMORY BOOK · 01 / 05"
    const currentNum = String(currentPageIndex + 1).padStart(2, '0');
    const totalNum = String(total).padStart(2, '0');
    if (pageLabel) {
      pageLabel.textContent = `MEMORY BOOK · ${currentNum} / ${totalNum}`;
    }

    renderDots(total, currentPageIndex);
  }

  function flipNext() {
    const pages = getPages();
    if (isFlipping) return;
    if (currentPageIndex < pages.length - 1) {
      updatePageUI(currentPageIndex + 1, 1);
    } else {
      scrapbookEl.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(-4deg)' },
        { transform: 'rotateY(0deg)' }
      ], { duration: 320 });
      showToast('وصلت لآخر صفحة في كتاب الذكريات 💖');
    }
  }

  function flipPrev() {
    if (isFlipping) return;
    if (currentPageIndex > 0) {
      updatePageUI(currentPageIndex - 1, -1);
    } else {
      scrapbookEl.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(4deg)' },
        { transform: 'rotateY(0deg)' }
      ], { duration: 320 });
      showToast('دي أول صفحة في كتاب ذكرياتنا 💗');
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); flipPrev(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); flipNext(); });

  // Mobile Touch Gestures (Swipe to flip page like real book)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  if (scrapbookEl) {
    scrapbookEl.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    scrapbookEl.addEventListener('touchend', e => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        // Detect horizontal swipe
        if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
          if (deltaX < 0) {
            flipNext(); // Swiped left -> page turns forward
          } else {
            flipPrev(); // Swiped right -> page turns back
          }
        } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && elapsed < 350) {
          // Tap on right half to turn next, tap on left half to turn prev
          const rect = scrapbookEl.getBoundingClientRect();
          const tapX = e.changedTouches[0].clientX - rect.left;
          if (tapX > rect.width * 0.58) flipNext();
          else if (tapX < rect.width * 0.42) flipPrev();
        }
      }
    }, { passive: true });

    // Desktop click on book sides to flip
    scrapbookEl.addEventListener('click', e => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('label') || e.target.closest('video')) return;
      const rect = scrapbookEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX > rect.width * 0.6) flipNext();
      else if (clickX < rect.width * 0.4) flipPrev();
    });
  }

  // Dynamic Upload Handler (Adds new page DIRECTLY inside the book)
  function addPhotoToBook(file) {
    const url = URL.createObjectURL(file);
    const pages = getPages();
    const newPageNum = pages.length + 1;

    const section = document.createElement('section');
    section.className = 'book-page';
    section.setAttribute('data-page', String(newPageNum));

    section.innerHTML = `
      <div class="tape tape-center"></div>
      <div class="photo-frame">
        <img src="${url}" alt="Memory ${newPageNum}" loading="lazy">
      </div>
      <div class="page-content">
        <h4 class="photo-caption" lang="ar" dir="rtl">ذكرى جديدة في حكايتنا 💖</h4>
        <p class="photo-sub">A new memory added with love ♡</p>
      </div>
      <span class="sticker sticker-top">✿</span>
      <span class="sticker sticker-bottom">♡</span>
      <span class="page-number">— ${newPageNum} —</span>
    `;

    bookPagesContainer.appendChild(section);
    return newPageNum;
  }

  $('photoUpload').addEventListener('change', e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let lastAddedNum = currentPageIndex + 1;
    files.forEach(file => {
      lastAddedNum = addPhotoToBook(file);
    });

    const total = getPages().length;
    renderDots(total, currentPageIndex);

    // Smoothly turn to the newly added page!
    setTimeout(() => {
      updatePageUI(lastAddedNum - 1, 1);
    }, 120);

    showToast(`${files.length} صورة اتضافت مباشرة لكتاب الذكريات! 📖💖`);
    e.target.value = '';
  });

  $('videoUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const pages = getPages();
    const newPageNum = pages.length + 1;

    const section = document.createElement('section');
    section.className = 'book-page';
    section.setAttribute('data-page', String(newPageNum));

    section.innerHTML = `
      <div class="tape tape-center"></div>
      <div class="photo-frame">
        <video src="${url}" controls playsinline webkit-playsinline></video>
      </div>
      <div class="page-content">
        <h4 class="photo-caption" lang="ar" dir="rtl">فيديو من ذكرياتنا الحلوة 🎬✨</h4>
        <p class="photo-sub">Our video moments together ♡</p>
      </div>
      <span class="sticker sticker-top">▶</span>
      <span class="sticker sticker-bottom">💗</span>
      <span class="page-number">— ${newPageNum} —</span>
    `;

    bookPagesContainer.appendChild(section);
    const total = getPages().length;
    renderDots(total, currentPageIndex);

    setTimeout(() => {
      updatePageUI(newPageNum - 1, 1);
    }, 120);

    showToast('فيديو جديد اتضاف في صفحة خاصة في الكتاب! 🎬💖');
    e.target.value = '';
  });

  // Initialize book on Page 1
  updatePageUI(0, 0);

  // Audio player with smooth touch scrubber
  const audio = $('audioPlayer'), playBtn = $('playBtn'), progress = $('musicProgress');
  const timeText = $('currentTime'), durationText = $('duration');
  let isSeeking = false;

  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  playBtn.addEventListener('click', async () => {
    if (!audio.src || audio.error) {
      showToast('Add your song file or use “＋ Add song” 🎵');
      return;
    }
    try {
      if (audio.paused) {
        await audio.play();
        playBtn.textContent = 'Ⅱ';
        playBtn.setAttribute('aria-label', 'Pause song');
      } else {
        audio.pause();
        playBtn.textContent = '▶';
        playBtn.setAttribute('aria-label', 'Play song');
      }
    } catch {
      showToast('Could not play this file. Try adding an MP3 🎵');
    }
  });

  function startSeek() { isSeeking = true; }
  function handleSeekInput() {
    isSeeking = true;
    if (audio.duration) {
      timeText.textContent = formatTime((Number(progress.value) / 100) * audio.duration);
    }
  }
  function commitSeek() {
    if (audio.duration) {
      audio.currentTime = (Number(progress.value) / 100) * audio.duration;
    }
    isSeeking = false;
  }

  progress.addEventListener('pointerdown', startSeek);
  progress.addEventListener('touchstart', startSeek, { passive: true });
  progress.addEventListener('input', handleSeekInput);
  progress.addEventListener('change', commitSeek);
  progress.addEventListener('pointerup', commitSeek);
  progress.addEventListener('touchend', commitSeek);

  audio.addEventListener('timeupdate', () => {
    if (!isSeeking) {
      timeText.textContent = formatTime(audio.currentTime);
      if (audio.duration) progress.value = String((audio.currentTime / audio.duration) * 100);
    }
  });
  audio.addEventListener('loadedmetadata', () => durationText.textContent = formatTime(audio.duration));
  audio.addEventListener('ended', () => {
    playBtn.textContent = '▶';
    progress.value = '0';
  });
  audio.addEventListener('error', () => {
    $('trackName').textContent = 'No song added yet — choose your own below';
  });

  $('restartBtn').addEventListener('click', () => {
    audio.currentTime = 0;
    if (audio.paused) {
      audio.play().then(() => { playBtn.textContent = 'Ⅱ'; }).catch(() => {});
    }
  });

  $('audioUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    audio.src = URL.createObjectURL(file);
    $('trackName').textContent = file.name;
    audio.load();
    showToast('Your song is ready 🎶 Press play!');
  });

  $('surpriseBtn').addEventListener('click', () => {
    const count = window.innerWidth < 640 ? 70 : 150;
    burst(window.innerWidth * (0.2 + Math.random() * 0.6), window.innerHeight * 0.35, count);
    showToast('You deserve every beautiful thing in this world, Malak! 💖🎁');
  });

  $('effectsToggle').addEventListener('change', e => {
    document.body.classList.toggle('no-effects', !e.target.checked);
    showToast(e.target.checked ? 'Magic effects are on ✨' : 'Soft mode enabled 🌙');
  });

  $('relockBtn').addEventListener('click', () => {
    lockScreen.hidden = false;
    lockScreen.classList.remove('unlocked');
    mainSite.classList.remove('visible');
    mainSite.setAttribute('inert', '');
    mainSite.inert = true;
    document.body.classList.add('locked');
    day.value = ''; month.value = ''; year.value = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => day.focus(), 250);
  });

  // Mobile-optimized canvas particle effects: sparkles, hearts and confetti.
  const canvas = $('sparkleCanvas'), ctx = canvas.getContext('2d');
  let width = 0, height = 0, particles = [];
  let lastWidth = 0;

  function resize() {
    const currentWidth = window.innerWidth;
    if (lastWidth === currentWidth && Math.abs(window.innerHeight - (height / (window.devicePixelRatio || 1))) < 130) {
      return;
    }
    lastWidth = currentWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.width = window.innerWidth * dpr;
    height = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  const symbols = ['✦', '♡', '✧', '·', '♥'];

  function addParticle(x, y, burstMode = false) {
    const isMobile = window.innerWidth < 640;
    const maxParticles = isMobile ? 45 : 110;
    if (!burstMode && particles.length >= maxParticles) return;

    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * (burstMode ? (isMobile ? 6 : 9) : 0.6),
      vy: burstMode ? (Math.random() - 0.5) * (isMobile ? 6 : 9) : (0.45 + Math.random() * 0.95),
      life: burstMode ? (45 + Math.random() * 30) : (65 + Math.random() * 70),
      size: burstMode ? (7 + Math.random() * (isMobile ? 10 : 14)) : (4 + Math.random() * 8),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      spin: Math.random() * 6,
      alpha: 1
    });
  }

  function burst(x, y, count) {
    const actualCount = window.innerWidth < 640 ? Math.min(count, 65) : count;
    for (let i = 0; i < actualCount; i++) addParticle(x, y, true);
  }

  function frame() {
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (!document.body.classList.contains('no-effects')) {
      const isMobile = window.innerWidth < 640;
      const spawnChance = isMobile ? 0.22 : 0.45;
      if (Math.random() < spawnChance) {
        addParticle(Math.random() * window.innerWidth, -5, false);
      }
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.min(1, p.life / 30);
        p.spin += 0.03;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = Math.random() > 0.5 ? '#ffe2b8' : '#ff9dbd';
        ctx.font = `${p.size}px serif`;
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      });
      particles = particles.filter(p => p.life > 0 && p.y < window.innerHeight + 30);
    }
    requestAnimationFrame(frame);
  }
  frame();

  setTimeout(() => burst(window.innerWidth / 2, window.innerHeight * 0.22, 16), 700);
})();
