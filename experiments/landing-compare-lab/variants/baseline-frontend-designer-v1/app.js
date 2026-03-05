(() => {
  const page = document.getElementById('page');
  const logo = document.getElementById('brandLogo');
  const brandSlogan = document.getElementById('brandSlogan');
  const heroFrameA = document.getElementById('heroFrameA');
  const heroFrameB = document.getElementById('heroFrameB');
  const heroTitle = document.getElementById('heroTitle');
  const heroSub = document.getElementById('heroSub');
  const heroChips = document.getElementById('heroChips');
  const storyFrame = document.getElementById('storyFrame');
  const storyBadge = document.getElementById('storyBadge');
  const storyCards = document.getElementById('storyCards');
  const timer = document.getElementById('timer');
  const sticker = document.getElementById('sticker');

  const state = {
    config: null,
    heroBeat: -1,
    storyBeat: -1,
    ctaLevel: 1,
    frameIndex: 0,
    nextFrameIndex: 1,
    activeLayer: 'A',
    storyRunning: false
  };

  function getBeatIndex(time, beats) {
    for (let i = 0; i < beats.length; i += 1) {
      if (time >= beats[i].start && time < beats[i].end) return i;
    }
    return beats.length - 1;
  }

  function setFrameWithCrossfade(nextSrc) {
    const inactive = state.activeLayer === 'A' ? heroFrameB : heroFrameA;
    const active = state.activeLayer === 'A' ? heroFrameA : heroFrameB;

    inactive.src = nextSrc;
    inactive.style.opacity = '1';
    active.style.opacity = '0';
    state.activeLayer = state.activeLayer === 'A' ? 'B' : 'A';
  }

  window.setHeroBeat = function setHeroBeat(index) {
    if (!state.config || index === state.heroBeat) return;
    state.heroBeat = index;

    const beat = state.config.timing.heroBeats[index];
    heroTitle.textContent = beat.title;
    heroSub.textContent = beat.sub;

    [...heroChips.children].forEach((chip, i) => chip.classList.toggle('active', i === index));
    window.setCtaIntensity(beat.ctaLevel);
  };

  window.setStoryBeat = function setStoryBeat(index) {
    if (!state.config || index === state.storyBeat) return;
    state.storyBeat = index;

    const beat = state.config.timing.storyBeats[index];
    storyBadge.textContent = `${beat.title} · ${beat.sub}`;

    const sceneIndex = index % state.config.visuals.scenes.length;
    storyFrame.src = state.config.visuals.scenes[sceneIndex];

    [...storyCards.children].forEach((card, i) => card.classList.toggle('active', i === index));
    if (beat.ctaLevel > 1) window.setCtaIntensity(2);
  };

  window.setCtaIntensity = function setCtaIntensity(level) {
    if (state.ctaLevel === level) return;
    state.ctaLevel = level;
    page.dataset.ctaIntensity = String(level);
  };

  function appendParams(url, source) {
    const target = new URL(url);
    const current = new URL(window.location.href);
    ['src', 'campaign', 'adgroup', 'creative'].forEach((key) => {
      const value = current.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });

    target.searchParams.set('lp_source', source || 'unknown');
    return target.toString();
  }

  function bindCtas() {
    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = appendParams(state.config.cta.androidUrl, btn.dataset.source);
      });
    });
  }

  function buildStoryCards() {
    storyCards.innerHTML = state.config.timing.storyBeats
      .map(
        (beat, i) =>
          `<article class="story-card ${i === 0 ? 'active' : ''}" role="listitem"><strong>${beat.title}</strong><span>${beat.sub}</span></article>`
      )
      .join('');
  }

  function buildHeroChips() {
    heroChips.innerHTML = state.config.timing.heroBeats
      .map((beat, i) => `<li class="${i === 0 ? 'active' : ''}">${beat.title}</li>`)
      .join('');
  }

  function startHeroLoop() {
    const frames = [state.config.visuals.hero, ...state.config.visuals.scenes];
    heroFrameA.src = frames[0];
    heroFrameA.style.opacity = '1';
    heroFrameB.style.opacity = '0';

    const started = performance.now();
    window.setInterval(() => {
      const elapsed = ((performance.now() - started) % 4000) / 1000;
      const beatIndex = getBeatIndex(elapsed, state.config.timing.heroBeats);
      window.setHeroBeat(beatIndex);

      const nextIndex = beatIndex % frames.length;
      if (nextIndex !== state.frameIndex) {
        state.frameIndex = nextIndex;
        setFrameWithCrossfade(frames[nextIndex]);
      }
    }, 180);
  }

  function startStoryLoop() {
    const section = document.getElementById('storySection');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          state.storyRunning = entry.isIntersecting;
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(section);

    const start = performance.now();
    window.setInterval(() => {
      if (!state.storyRunning) return;
      const t = ((performance.now() - start) % 8000) / 1000;
      window.setStoryBeat(getBeatIndex(t, state.config.timing.storyBeats));
    }, 220);
  }

  function startTimer(total = 240) {
    let rest = total;
    const tick = () => {
      const mm = String(Math.floor(rest / 60)).padStart(2, '0');
      const ss = String(rest % 60).padStart(2, '0');
      timer.textContent = `${mm}:${ss}`;
      rest = rest <= 0 ? total : rest - 1;
    };
    tick();
    window.setInterval(tick, 1000);
  }

  async function loadConfig() {
    if (window.__LP_CONFIG) return window.__LP_CONFIG;
    try {
      const res = await fetch('../../input/landing-config.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('config fetch failed');
      return await res.json();
    } catch (error) {
      console.warn('landing config fallback failed', error);
      return null;
    }
  }

  async function init() {
    state.config = await loadConfig();
    if (!state.config) return;

    logo.src = state.config.brand.logoUrl;
    brandSlogan.textContent = state.config.brand.slogan;
    sticker.src = state.config.visuals.stickers[0];
    storyFrame.src = state.config.visuals.scenes[0];

    buildHeroChips();
    buildStoryCards();
    bindCtas();

    window.setHeroBeat(0);
    window.setStoryBeat(0);

    document.getElementById('heroCta').textContent = state.config.cta.text;
    document.getElementById('stickyMain').textContent = state.config.cta.text.replace('拼多多', '');

    startHeroLoop();
    startStoryLoop();
    startTimer(240);
  }

  init();
})();
