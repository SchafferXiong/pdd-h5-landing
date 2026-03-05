(() => {
  const shell = document.getElementById('shell');
  const logo = document.getElementById('logo');
  const tag = document.getElementById('tag');
  const heroMain = document.getElementById('heroMain');
  const heroScene = document.getElementById('heroScene');
  const chips = document.getElementById('chips');
  const heroTitle = document.getElementById('heroTitle');
  const heroSub = document.getElementById('heroSub');
  const storyImg = document.getElementById('storyImg');
  const storySticker = document.getElementById('storySticker');
  const storyTitle = document.getElementById('storyTitle');
  const storySub = document.getElementById('storySub');
  const track = document.getElementById('track');
  const timer = document.getElementById('timer');
  const progressBar = document.getElementById('progressBar');

  const state = {
    config: null,
    heroBeat: 0,
    storyBeat: 0,
    storyEnabled: false
  };

  function beatIndex(t, beats) {
    for (let i = 0; i < beats.length; i += 1) {
      if (t >= beats[i].start && t < beats[i].end) return i;
    }
    return beats.length - 1;
  }

  window.setHeroBeat = function setHeroBeat(i) {
    if (i === state.heroBeat || !state.config) return;
    state.heroBeat = i;

    const beat = state.config.timing.heroBeats[i];
    heroTitle.textContent = beat.title;
    heroSub.textContent = beat.sub;

    const scene = state.config.visuals.scenes[i % state.config.visuals.scenes.length];
    heroScene.src = scene;
    heroScene.style.opacity = '0.32';

    [...chips.children].forEach((chip, idx) => chip.classList.toggle('active', idx === i));
    window.setCtaIntensity(beat.ctaLevel);
  };

  window.setStoryBeat = function setStoryBeat(i) {
    if (i === state.storyBeat || !state.config) return;
    state.storyBeat = i;

    const beat = state.config.timing.storyBeats[i];
    storyTitle.textContent = beat.title;
    storySub.textContent = beat.sub;
    storyImg.src = state.config.visuals.scenes[i % state.config.visuals.scenes.length];

    [...track.children].forEach((card, idx) => card.classList.toggle('active', idx === i));
    window.setCtaIntensity(beat.ctaLevel);
  };

  window.setCtaIntensity = function setCtaIntensity(level) {
    shell.dataset.ctaIntensity = String(level);
  };

  function withParams(url, source) {
    const u = new URL(url);
    const current = new URL(window.location.href);
    ['src', 'campaign', 'adgroup', 'creative'].forEach((key) => {
      const v = current.searchParams.get(key);
      if (v) u.searchParams.set(key, v);
    });
    u.searchParams.set('lp_source', source || 'unknown');
    return u.toString();
  }

  function bindCTA() {
    document.querySelectorAll('[data-source]').forEach((el) => {
      el.addEventListener('click', () => {
        window.location.href = withParams(state.config.cta.androidUrl, el.dataset.source);
      });
    });
  }

  function renderChips() {
    chips.innerHTML = state.config.timing.heroBeats
      .map((beat, idx) => `<span class="metric ${idx === 0 ? 'active' : ''}">${beat.title}</span>`)
      .join('');
  }

  function renderCards() {
    track.innerHTML = state.config.timing.storyBeats
      .map(
        (beat, i) =>
          `<article class="card ${i === 0 ? 'active' : ''}" role="listitem"><strong>${beat.title}</strong><span>${beat.sub}</span></article>`
      )
      .join('');
  }

  function startHeroSequence() {
    const start = performance.now();
    heroMain.src = state.config.visuals.hero;
    heroScene.src = state.config.visuals.scenes[0];

    window.setInterval(() => {
      const t = ((performance.now() - start) % 4000) / 1000;
      window.setHeroBeat(beatIndex(t, state.config.timing.heroBeats));
    }, 170);
  }

  function startStorySequence() {
    const storySection = document.getElementById('story');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        state.storyEnabled = entry.isIntersecting;
      });
    }, { threshold: 0.36 });
    io.observe(storySection);

    const begin = performance.now();
    window.setInterval(() => {
      if (!state.storyEnabled) return;
      const t = ((performance.now() - begin) % 8000) / 1000;
      window.setStoryBeat(beatIndex(t, state.config.timing.storyBeats));
    }, 220);
  }

  function startCountdown(total = 240) {
    let rest = total;
    const tick = () => {
      const mm = String(Math.floor(rest / 60)).padStart(2, '0');
      const ss = String(rest % 60).padStart(2, '0');
      timer.textContent = `${mm}:${ss}`;
      const progress = ((total - rest) / total) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
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
    tag.textContent = state.config.brand.slogan;
    storySticker.src = state.config.visuals.stickers[0];

    renderChips();
    renderCards();
    bindCTA();

    document.getElementById('heroBtn').textContent = state.config.cta.text;

    startHeroSequence();
    startStorySequence();
    startCountdown(240);
  }

  init();
})();
