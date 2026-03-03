(() => {
  const config = window.__LP_CONFIG || {};

  const el = {
    logo: document.getElementById('brandLogo'),
    ratingChip: document.getElementById('ratingChip'),
    tickerText: document.getElementById('tickerText'),
    heroSub: document.getElementById('heroSub'),
    stageWrap: document.getElementById('stageWrap'),
    stageImage: document.getElementById('stageImage'),
    beatPills: document.getElementById('beatPills'),
    benefitGrid: document.getElementById('benefitGrid'),
    stickyCta: document.getElementById('stickyCta'),
    legalText: document.getElementById('legalText')
  };

  const state = {
    beatIndex: 0,
    tickerIndex: 0
  };

  const tickerPool = [
    'AI生活助理：一句话点外卖、订机酒、找餐厅',
    'AI办公助手：做应用、做报表、调研分析、数据处理',
    'AI生图生视频：海量创意特效，AI生成同款',
    '千问小讲堂：可视化讲解，1对1语音互动辅导',
    '文档创作编辑：写作与PPT，智能编辑与文件总结'
  ];

  function resolveAsset(path) {
    try {
      return new URL(path, document.baseURI).href;
    } catch (_error) {
      return path;
    }
  }

  function appendParams(url, source) {
    const target = new URL(url, window.location.href);
    const current = new URL(window.location.href);
    ['src', 'campaign', 'adgroup', 'creative'].forEach((key) => {
      const value = current.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });
    target.searchParams.set('lp_source', source || 'main');
    return target.toString();
  }

  function setCtaLevel(level) {
    document.querySelectorAll('.cta, .sticky-cta').forEach((btn) => {
      btn.classList.remove('level-1', 'level-2', 'level-3');
      btn.classList.add(`level-${level}`);
    });
  }

  function setPillFocus(index) {
    if (!el.beatPills) return;
    const pills = Array.from(el.beatPills.querySelectorAll('li'));
    pills.forEach((pill, i) => pill.classList.toggle('active', i === index));
  }

  function setBenefitFocus(index) {
    if (!el.benefitGrid) return;
    const cards = Array.from(el.benefitGrid.querySelectorAll('.benefit-card'));
    cards.forEach((card, i) => card.classList.toggle('is-focus', i === index));
  }

  function setStage(sceneIndex) {
    const scenes = config.visuals?.scenes || [];
    if (!scenes.length || !el.stageImage) return;

    const next = resolveAsset(scenes[sceneIndex % scenes.length]);
    if (el.stageImage.src === next) return;

    el.stageImage.style.opacity = '0.25';
    window.setTimeout(() => {
      el.stageImage.src = next;
      el.stageImage.style.opacity = '1';
    }, 120);
  }

  function setBeat(index) {
    const beats = config.timing?.heroBeats || [];
    if (!beats.length) return;
    const beat = beats[index % beats.length];

    if (el.heroSub) el.heroSub.textContent = beat.sub;
    setPillFocus(beat.focus || 0);
    setBenefitFocus(beat.focus || 0);
    setStage(beat.scene || 0);
    setCtaLevel(beat.ctaLevel || 1);
  }

  function setTicker() {
    if (!el.tickerText) return;
    el.tickerText.textContent = tickerPool[state.tickerIndex % tickerPool.length];
  }

  function bindCtas() {
    const url = config.cta?.androidUrl || 'https://app.mi.com/details?id=com.aliyun.tongyi';
    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = appendParams(url, btn.dataset.source || 'main');
      });
    });
  }

  function bindStickyVisibility() {
    if (!el.stickyCta) return;
    const toggle = () => {
      const shouldShow = window.scrollY > 120;
      el.stickyCta.classList.toggle('is-visible', shouldShow);
      if (el.legalText) {
        el.legalText.classList.toggle('is-visible', shouldShow);
      }
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
  }

  function initBrand() {
    if (el.logo && config.brand?.logoUrl) {
      el.logo.src = resolveAsset(config.brand.logoUrl);
      el.logo.addEventListener('error', () => {
        el.logo.style.display = 'none';
      });
    }

    if (el.ratingChip && config.proof?.ratingVotes) {
      el.ratingChip.textContent = `${config.proof.ratingVotes}次评分`;
    }
  }

  function initStage() {
    if (!el.stageImage) return;
    const hero = config.visuals?.hero;
    if (hero) {
      el.stageImage.src = resolveAsset(hero);
    }
    el.stageImage.addEventListener('error', () => {
      el.stageWrap.classList.add('is-fallback');
      el.stageImage.remove();
    });
  }

  function init() {
    initBrand();
    initStage();
    bindCtas();
    bindStickyVisibility();
    setTicker();
    setBeat(0);

    window.setInterval(() => {
      state.tickerIndex = (state.tickerIndex + 1) % tickerPool.length;
      setTicker();
    }, 1800);

    window.setInterval(() => {
      const beats = config.timing?.heroBeats || [];
      if (!beats.length) return;
      state.beatIndex = (state.beatIndex + 1) % beats.length;
      setBeat(state.beatIndex);
    }, 1000);
  }

  init();
})();
