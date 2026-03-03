(() => {
  const fallbackConfig = {
    brand: {
      name: '拼多多',
      tagline: '多实惠 多乐趣',
      logoUrl: './assets/img/logo/pdd-logo.png'
    },
    media: {
      generated: {
        hero: './assets/img/generated/hero-conversion-kv.svg',
        benefit: './assets/img/generated/benefit-promo-atlas.svg'
      }
    },
    timing: {
      heroBeats: [
        { start: 0.0, end: 1.2, title: '百亿补贴', sub: '官方直补，买贵必赔' },
        { start: 1.2, end: 2.6, title: '天天领现金', sub: '微信到账，速度可见' },
        { start: 2.6, end: 4.0, title: '万人团', sub: '一件也是批发价' }
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
  const heroArt = document.getElementById('heroArt');
  const benefitVisual = document.getElementById('benefitVisual');
  const heroChips = document.getElementById('heroChips');
  const heroBeatTitle = document.getElementById('heroBeatTitle');
  const heroBeatSub = document.getElementById('heroBeatSub');
  const heroTrustRail = document.getElementById('heroTrustRail');
  const benefitBeatTitle = document.getElementById('benefitBeatTitle');
  const benefitBeatSub = document.getElementById('benefitBeatSub');
  const benefitCards = document.getElementById('benefitCards');
  const valueCanvas = document.getElementById('valueCanvas');
  const benefitMarquee = document.getElementById('benefitMarquee');
  const subsidyPool = document.getElementById('subsidyPool');
  const cashBeat = document.getElementById('cashBeat');
  const groupHeat = document.getElementById('groupHeat');
  const countdown = document.getElementById('countdown');

  const state = {
    heroBeat: -1,
    benefitBeat: -1,
    ctaIntensity: 1,
    config: null,
    statTimer: null
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

  function setSceneFocus(index) {
    if (!valueCanvas) return;
    const cards = [...valueCanvas.children];
    if (!cards.length) return;
    const safeIndex = Math.max(0, index % cards.length);

    cards.forEach((card, i) => {
      card.classList.toggle('active', i === safeIndex);
    });
  }

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

    window.setCtaIntensity(index === state.config.timing.heroBeats.length - 1 ? 2 : 1);
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

  function startBeatLoop(beats, setter) {
    if (!Array.isArray(beats) || beats.length === 0) return;
    const totalSec = beats[beats.length - 1].end;
    const startedAt = Date.now();

    window.setInterval(() => {
      const t = ((Date.now() - startedAt) / 1000) % totalSec;
      setter(findBeatIndex(t, beats));
    }, 180);
  }

  function formatWan(numberInWan) {
    return `¥${Math.round(numberInWan).toLocaleString('zh-CN')}万`;
  }

  function startStatTicker() {
    const tick = () => {
      if (subsidyPool) {
        const amount = 1260 + Math.random() * 120;
        subsidyPool.textContent = formatWan(amount);
      }

      if (cashBeat) {
        const sec = (1.8 + Math.random() * 0.5).toFixed(1);
        cashBeat.textContent = `${sec}s`;
      }

      if (groupHeat) {
        const heat = (9.6 + Math.random() * 0.3).toFixed(1);
        groupHeat.textContent = heat;
      }
    };

    tick();
    state.statTimer = window.setInterval(tick, 2200);
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

  function getScenes(config) {
    if (Array.isArray(config.generatedScenes) && config.generatedScenes.length) return config.generatedScenes;
    return fallbackConfig.generatedScenes;
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

  function renderHeroTrustRail(config) {
    if (!heroTrustRail) return;
    const source = Array.isArray(config.benefits) ? config.benefits : fallbackConfig.benefits;
    const tokens = [...new Set(source.flatMap((item) => item.split('/').map((s) => s.trim()).filter(Boolean)))].slice(0, 6);

    heroTrustRail.innerHTML = tokens.map((item) => `<span class="trust-tag">${item}</span>`).join('');
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
              <div class="scene-kicker">AI 场景图</div>
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

    const heroImage = config.media?.generated?.hero || fallbackConfig.media.generated.hero;
    const benefitImage = config.media?.generated?.benefit || fallbackConfig.media.generated.benefit;

    if (heroArt) heroArt.src = heroImage;
    if (benefitVisual) benefitVisual.src = benefitImage;

    document.querySelectorAll('.cta-main, .cta-strong').forEach((btn) => {
      btn.textContent = config.cta.buttonText;
    });

    renderHeroChips(config.timing.heroBeats);
    renderBenefitCards(config.timing.benefitBeats);
    renderHeroTrustRail(config);
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

    startBeatLoop(config.timing.heroBeats, window.setHeroBeat);
    startBeatLoop(config.timing.benefitBeats, window.setBenefitBeat);
    startStatTicker();
  }

  init();
})();
