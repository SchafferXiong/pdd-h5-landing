(() => {
  const fallbackConfig = {
    brand: {
      name: '拼多多',
      tagline: '多实惠 多乐趣',
      logoUrl: './assets/img/logo/pdd-logo.png'
    },
    media: {
      heroMain4s: './assets/video/hero-main-4s.mp4',
      benefit8s: './assets/video/benefit-8s.mp4',
      posters: {
        hero: './assets/video/hero-poster.jpg',
        benefit: './assets/video/benefit-poster.jpg'
      }
    },
    timing: {
      heroBeats: [
        { start: 0.0, end: 0.8, title: '省多多小金库', sub: '品牌记忆点直达' },
        { start: 0.8, end: 2.0, title: '百亿补贴·官方直补', sub: '全网低价 + 单单返现折上折' },
        { start: 2.0, end: 3.2, title: '天天领现金', sub: '微信打款 秒到账' },
        { start: 3.2, end: 4.0, title: '立即下载', sub: '抢限时福利窗口' }
      ],
      benefitBeats: [
        { start: 0.0, end: 2.0, title: '万人团', sub: '一件也是批发价' },
        { start: 2.0, end: 4.0, title: '商家入驻', sub: '0佣金 千亿扶持' },
        { start: 4.0, end: 6.0, title: '多多买菜', sub: '限时抽 全额返券' },
        { start: 6.0, end: 8.0, title: '全域优惠', sub: '百亿补贴 + 秒杀联动' }
      ]
    },
    cta: {
      buttonText: '立即下载拼多多',
      androidUrl: 'https://app.mi.com/details?id=com.xunmeng.pinduoduo'
    },
    benefits: [
      '百亿补贴 / 全网低价 / 官方直补 / 单单返现折上折',
      '天天领现金 / 微信打款 / 秒到账',
      '商家入驻 0佣金 / 千亿扶持',
      '万人团 / 一件也是批发价',
      '省多多小金库 / 多实惠 多乐趣'
    ],
    generatedScenes: [
      {
        title: '百亿补贴矩阵',
        caption: '官方直补 + 全网低价，首屏直接感知高性价比。',
        image: './assets/img/generated/scene-subsidy-wave.svg',
        widgetLabel: '补贴命中率',
        widgetValue: '98%',
        meter: 98
      },
      {
        title: '天天返现流',
        caption: '下单返现与现金到账并行，形成即时获得感。',
        image: './assets/img/generated/scene-cash-fountain.svg',
        widgetLabel: '到账速度',
        widgetValue: '2s',
        meter: 86
      },
      {
        title: '万人团秒跟进',
        caption: '一件也享批发价，群体下单氛围持续拉升转化。',
        image: './assets/img/generated/scene-group-rush.svg',
        widgetLabel: '拼团热度',
        widgetValue: '9.8',
        meter: 93
      }
    ]
  };

  const app = document.getElementById('app');
  const heroVideo = document.getElementById('heroVideo');
  const benefitVideo = document.getElementById('benefitVideo');
  const heroChips = document.getElementById('heroChips');
  const heroBeatTitle = document.getElementById('heroBeatTitle');
  const heroBeatSub = document.getElementById('heroBeatSub');
  const benefitBeatTitle = document.getElementById('benefitBeatTitle');
  const benefitBeatSub = document.getElementById('benefitBeatSub');
  const benefitCards = document.getElementById('benefitCards');
  const valueCanvas = document.getElementById('valueCanvas');
  const benefitMarquee = document.getElementById('benefitMarquee');
  const countdown = document.getElementById('countdown');

  const state = {
    heroBeat: -1,
    benefitBeat: -1,
    ctaIntensity: 1,
    config: null
  };

  const safeDuration = (video) => Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;

  window.setHeroBeat = function setHeroBeat(index) {
    if (state.heroBeat === index || !state.config) return;
    state.heroBeat = index;

    const beat = state.config.timing.heroBeats[index];
    if (!beat) return;

    heroBeatTitle.textContent = beat.title;
    heroBeatSub.textContent = beat.sub;

    [...heroChips.children].forEach((chip, i) => {
      chip.classList.toggle('active', i === index);
    });
  };

  window.setBenefitBeat = function setBenefitBeat(index) {
    if (state.benefitBeat === index || !state.config) return;
    state.benefitBeat = index;

    const beat = state.config.timing.benefitBeats[index];
    if (!beat) return;

    benefitBeatTitle.textContent = beat.title;
    benefitBeatSub.textContent = beat.sub;

    [...benefitCards.children].forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    setSceneFocus(index);
  };

  window.setCtaIntensity = function setCtaIntensity(level) {
    if (state.ctaIntensity === level) return;
    state.ctaIntensity = level;
    app.dataset.ctaIntensity = String(level);
  };

  function findBeatIndex(t, beats) {
    for (let i = 0; i < beats.length; i += 1) {
      if (t >= beats[i].start && t < beats[i].end) return i;
    }
    return beats.length - 1;
  }

  function syncHeroFrame(time) {
    const beats = state.config.timing.heroBeats;
    const idx = findBeatIndex(time, beats);
    window.setHeroBeat(idx);

    if (idx === beats.length - 1) {
      window.setCtaIntensity(2);
    } else if (idx >= 1) {
      window.setCtaIntensity(1);
    } else {
      window.setCtaIntensity(0);
    }
  }

  function syncBenefitFrame(time) {
    const beats = state.config.timing.benefitBeats;
    const idx = findBeatIndex(time, beats);
    window.setBenefitBeat(idx);
  }

  function onHeroTick() {
    const duration = safeDuration(heroVideo) || 4;
    const t = heroVideo.currentTime % duration;
    syncHeroFrame(t);

    if ('requestVideoFrameCallback' in heroVideo) {
      heroVideo.requestVideoFrameCallback(onHeroTick);
    }
  }

  function onBenefitTick() {
    const duration = safeDuration(benefitVideo) || 8;
    const t = benefitVideo.currentTime % duration;
    syncBenefitFrame(t);

    if ('requestVideoFrameCallback' in benefitVideo) {
      benefitVideo.requestVideoFrameCallback(onBenefitTick);
    }
  }

  function startVideoSync(video, tick) {
    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(tick);
    } else {
      video.addEventListener('timeupdate', () => {
        tick();
      });
    }
  }

  function appendQueryParams(baseUrl, source) {
    try {
      const url = new URL(baseUrl);
      const pageUrl = new URL(window.location.href);
      const src = pageUrl.searchParams.get('src');
      const campaign = pageUrl.searchParams.get('campaign');

      url.searchParams.set('lp_source', source || 'unknown');
      if (src) url.searchParams.set('src', src);
      if (campaign) url.searchParams.set('campaign', campaign);
      return url.toString();
    } catch (err) {
      return baseUrl;
    }
  }

  function handleDownload(source) {
    const target = appendQueryParams(state.config.cta.androidUrl, source);
    window.location.href = target;
  }

  function bindCtas() {
    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handleDownload(btn.dataset.source);
      });
    });
  }

  function renderHeroChips(beats) {
    heroChips.innerHTML = beats
      .map((beat, idx) => `<span class="beat-chip ${idx === 0 ? 'active' : ''}">${beat.title}</span>`)
      .join('');
  }

  function renderBenefitCards(beats) {
    benefitCards.innerHTML = beats
      .map(
        (beat, idx) => `
          <article class="benefit-card ${idx === 0 ? 'active' : ''}">
            <div class="title">${beat.title}</div>
            <div class="sub">${beat.sub}</div>
          </article>
        `
      )
      .join('');
  }

  function getScenes(config) {
    if (Array.isArray(config.generatedScenes) && config.generatedScenes.length) return config.generatedScenes;
    return fallbackConfig.generatedScenes;
  }

  function setSceneFocus(index) {
    if (!valueCanvas) return;
    const cards = [...valueCanvas.children];
    if (!cards.length) return;
    const safeIndex = Math.max(0, index % cards.length);

    cards.forEach((card, i) => {
      card.classList.toggle('active', i === safeIndex);
    });
  }

  function renderValueCanvas(config) {
    if (!valueCanvas) return;
    const scenes = getScenes(config);
    valueCanvas.innerHTML = scenes
      .map((scene, idx) => {
        const meter = Math.max(20, Math.min(100, Number(scene.meter) || 75));
        return `
          <article class="scene-card ${idx === 0 ? 'active' : ''}" style="--delay:${idx * 0.08}s">
            <figure class="scene-image-wrap">
              <img class="scene-image" src="${scene.image}" alt="${scene.title}" loading="lazy" />
            </figure>
            <div class="scene-meta">
              <div class="scene-kicker">AI 视觉图层</div>
              <h3>${scene.title}</h3>
              <p>${scene.caption}</p>
              <div class="scene-widget">
                <span>${scene.widgetLabel}</span>
                <strong>${scene.widgetValue}</strong>
                <div class="widget-meter"><i style="--meter:${meter}%"></i></div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function renderBenefitMarquee(config) {
    if (!benefitMarquee) return;
    const source = Array.isArray(config.benefits) ? config.benefits : fallbackConfig.benefits;
    const tags = [...new Set(source.flatMap((item) => item.split('/').map((s) => s.trim()).filter(Boolean)))];

    benefitMarquee.innerHTML = `
      <div class="marquee-track">
        ${tags
          .slice(0, 12)
          .map(
            (tag, idx) =>
              `<span class="marquee-pill" style="--delay:${(idx * 0.05).toFixed(2)}s">${tag.replace(/\s+/g, ' ')}</span>`
          )
          .join('')}
      </div>
    `;
  }

  function startCountdown(totalSec = 240) {
    let remain = totalSec;
    const tick = () => {
      const min = String(Math.floor(remain / 60)).padStart(2, '0');
      const sec = String(remain % 60).padStart(2, '0');
      countdown.textContent = `${min}:${sec}`;
      remain = remain > 0 ? remain - 1 : totalSec;
    };
    tick();
    window.setInterval(tick, 1000);
  }

  function tryAutoplay(video, fallbackClassHost) {
    const playResult = video.play();
    if (playResult && typeof playResult.then === 'function') {
      playResult.catch(() => {
        fallbackClassHost.classList.add('video-fallback');
      });
    }
  }

  function watchBenefitSection() {
    const section = document.getElementById('benefitSection');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            benefitVideo.play().catch(() => {
              document.getElementById('benefitVideoShell').classList.add('video-fallback');
            });
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(section);
  }

  async function loadConfig() {
    const hint = window.__LP_CONFIG || {};
    if (!hint.manifestPath) return fallbackConfig;

    try {
      const response = await fetch(hint.manifestPath, { cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest load failed ${response.status}`);
      const manifest = await response.json();
      return manifest;
    } catch (err) {
      return fallbackConfig;
    }
  }

  function applyMedia(config) {
    const logo = document.getElementById('brandLogo');
    logo.src = config.brand.logoUrl;

    heroVideo.poster = config.media.posters.hero;
    heroVideo.querySelector('source').src = config.media.heroMain4s;
    heroVideo.load();

    benefitVideo.poster = config.media.posters.benefit;
    benefitVideo.querySelector('source').src = config.media.benefit8s;
    benefitVideo.load();

    document.querySelectorAll('.cta-main, .cta-strong').forEach((btn) => {
      btn.textContent = config.cta.buttonText;
    });

    renderHeroChips(config.timing.heroBeats);
    renderBenefitCards(config.timing.benefitBeats);
    renderValueCanvas(config);
    renderBenefitMarquee(config);
  }

  async function init() {
    const config = await loadConfig();
    state.config = config;
    window.__LP_CONFIG = config;

    applyMedia(config);
    bindCtas();
    startCountdown(240);

    window.setHeroBeat(0);
    window.setBenefitBeat(0);
    window.setCtaIntensity(1);

    startVideoSync(heroVideo, onHeroTick);
    startVideoSync(benefitVideo, onBenefitTick);

    tryAutoplay(heroVideo, document.getElementById('stageShell'));
    watchBenefitSection();
  }

  init();
})();
