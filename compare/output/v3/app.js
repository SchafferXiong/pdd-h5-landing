(() => {
  const body = document.body;
  if (!body) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const downloadBase = body.dataset.downloadUrl || 'https://app.mi.com/details?id=com.kuaishou.nebula';

  const ASSET_MAP = {
    logo: './assets/raw/logo.png',
    envelope_closed: './assets/processed/envelope-closed.svg',
    envelope_open: './assets/processed/envelope-open.svg',
    cta_shine: './assets/processed/cta-shine.svg',
    bg_pattern: './assets/backgrounds/bg-pattern.svg',
    icon_gift: './assets/icons/icon-gift.svg',
    icon_video: './assets/icons/icon-video.svg',
    icon_flash: './assets/icons/icon-flash.svg',
    icon_checkin: './assets/icons/icon-checkin.svg',
    icon_download: './assets/icons/icon-download.svg',
    icon_user_add: './assets/icons/icon-user-add.svg',
    icon_wallet: './assets/icons/icon-wallet.svg',
    step_install: './assets/icons/step-install.svg',
    step_register: './assets/icons/step-register.svg',
    step_withdraw: './assets/icons/step-withdraw.svg'
  };

  const AVATAR_POOL = [
    './assets/avatars/avatar-01.svg',
    './assets/avatars/avatar-02.svg',
    './assets/avatars/avatar-03.svg',
    './assets/avatars/avatar-04.svg',
    './assets/avatars/avatar-05.svg',
    './assets/avatars/avatar-06.svg',
    './assets/avatars/avatar-07.svg',
    './assets/avatars/avatar-08.svg'
  ];

  const BENEFIT_ICON_MAP = {
    gift: ASSET_MAP.icon_gift,
    video: ASSET_MAP.icon_video,
    flash: ASSET_MAP.icon_flash,
    checkin: ASSET_MAP.icon_checkin
  };

  const STEP_MAP = {
    install: ASSET_MAP.step_install,
    register: ASSET_MAP.step_register,
    withdraw: ASSET_MAP.step_withdraw
  };

  const PROOF_ICON_MAP = {
    gift: ASSET_MAP.icon_gift,
    video: ASSET_MAP.icon_video,
    flash: ASSET_MAP.icon_wallet,
    checkin: ASSET_MAP.icon_checkin
  };

  const MOTION_CONFIG = {
    loadingTimelineMs: {
      closedVisible: [0, 1000],
      transition: [1000, 1600],
      openHold: [1600, 2000]
    },
    tickerIntervalMs: 1800,
    withdrawIntervalMs: 1900,
    proofToastIntervalMs: 2400,
    claimCounterIntervalMs: 1300,
    countdownIntervalMs: 1000,
    ctaShineDurationMs: 1800,
    preloadTimeoutMs: 800,
    reducedMotionPolicy: {
      disableEnvelopeFloat: true,
      disableCtaSweep: true,
      disableAvatarFade: true
    }
  };

  const loadingScreen = document.getElementById('loadingScreen');
  const loadingProgress = document.getElementById('loadingProgress');
  const progressValue = document.getElementById('progressValue');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const loadingEnvelopeClosed = document.getElementById('loadingEnvelopeClosed');
  const loadingEnvelopeOpen = document.getElementById('loadingEnvelopeOpen');

  const mainPage = document.getElementById('mainPage');
  const stickyWrap = document.getElementById('stickyWrap');

  const tickerAvatar = document.getElementById('tickerAvatar');
  const liveTicker = document.getElementById('liveTicker');
  const countdown = document.getElementById('countdown');
  const rewardAmount = document.getElementById('rewardAmount');
  const claimCount = document.getElementById('claimCount');
  const withdrawList = document.getElementById('withdrawList');
  const proofToast = document.getElementById('proofToast');
  const proofCard = document.getElementById('proofCard');

  const ctaButtons = [...document.querySelectorAll('[data-cta]')];
  const ctaShineNodes = [...document.querySelectorAll('.cta-shine-layer')];
  const appLogoNodes = [...document.querySelectorAll('img[data-role=\"app-logo\"]')];
  const allImages = [...document.querySelectorAll('img[data-fallback-class]')];
  const benefitItems = [...document.querySelectorAll('.benefit-item[data-benefit-key]')];
  const proofItems = [...document.querySelectorAll('.proof-points article[data-proof-key]')];
  const stepItems = [...document.querySelectorAll('#convertCard li[data-step-key]')];

  const userPrefixes = ['139', '137', '158', '186', '151', '135', '188', '176'];
  const withdrawAmounts = [1.6, 2.8, 3.2, 5.5, 6.6, 8.8, 10, 12.5, 18.8];

  const timerIds = {
    progress: 0,
    openPhase: 0,
    reveal: 0,
    ticker: 0,
    count: 0,
    countdown: 0,
    list: 0,
    toast: 0,
    autoScroll: 0,
    loadingHide: 0
  };

  let currentClaimCount = 328691;
  let remainSeconds = 119;
  let userInterruptedScroll = false;
  let avatarCursor = 0;

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomAmount(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
  }

  function buildMaskedUser() {
    const prefix = userPrefixes[randomInt(0, userPrefixes.length - 1)];
    return `${prefix}****${randomInt(1000, 9999)}`;
  }

  function formatCountdown(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function safeBuildUrl(source) {
    try {
      const target = new URL(downloadBase, window.location.href);
      const current = new URL(window.location.href);
      const passthrough = ['src', 'campaign', 'channel', 'utm_source', 'utm_medium', 'utm_campaign'];

      target.searchParams.set('lp_source', source || 'unknown');
      passthrough.forEach((key) => {
        const value = current.searchParams.get(key);
        if (value) target.searchParams.set(key, value);
      });

      return target.toString();
    } catch (_err) {
      return downloadBase;
    }
  }

  function jumpDownload(source) {
    window.location.href = safeBuildUrl(source);
  }

  function bindCtas() {
    ctaButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        jumpDownload(btn.dataset.cta || 'unknown');
      });
    });
  }

  function bindImageFallback(images) {
    images.forEach((img) => {
      const fallbackClass = img.dataset.fallbackClass;
      if (!fallbackClass) return;

      img.addEventListener('error', () => {
        img.classList.add(fallbackClass);
        img.removeAttribute('src');
      });
    });
  }

  function preloadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    });
  }

  async function preloadCriticalAssets() {
    const critical = [
      ASSET_MAP.envelope_closed,
      ASSET_MAP.envelope_open,
      ASSET_MAP.cta_shine,
      ASSET_MAP.icon_gift,
      ASSET_MAP.icon_video,
      ASSET_MAP.icon_flash,
      ASSET_MAP.icon_checkin
    ];
    const keys = ['envelope_closed', 'envelope_open', 'cta_shine', 'icon_gift', 'icon_video', 'icon_flash', 'icon_checkin'];

    const timeoutSignal = new Promise((resolve) => {
      window.setTimeout(() => resolve({ status: 'timeout', states: {} }), MOTION_CONFIG.preloadTimeoutMs);
    });

    const preloadSignal = Promise.all(critical.map((src) => preloadImage(src))).then((states) => {
      const stateMap = {};
      keys.forEach((key, idx) => {
        stateMap[key] = states[idx];
      });
      const allLoaded = states.every(Boolean);
      return { status: allLoaded ? 'ok' : 'partial', states: stateMap };
    });

    const result = await Promise.race([timeoutSignal, preloadSignal]);
    if (!result.states.cta_shine) {
      ctaShineNodes.forEach((node) => {
        node.classList.add('is-fallback-cta-shine');
      });
    }

    if (!loadingStatusText) return;
    if (result.status === 'ok') {
      loadingStatusText.textContent = '福利加载完成，正在打开红包...';
    } else if (result.status === 'partial') {
      loadingStatusText.textContent = '部分素材加载中，先进入领取流程...';
    } else {
      loadingStatusText.textContent = '网络较慢，正在优先加载主流程...';
    }
  }

  function applyStaticAssets() {
    if (loadingEnvelopeClosed) loadingEnvelopeClosed.src = ASSET_MAP.envelope_closed;
    if (loadingEnvelopeOpen) loadingEnvelopeOpen.src = ASSET_MAP.envelope_open;
    if (tickerAvatar) tickerAvatar.src = AVATAR_POOL[0];
    appLogoNodes.forEach((node) => {
      node.src = ASSET_MAP.logo;
    });

    benefitItems.forEach((item) => {
      const key = item.dataset.benefitKey;
      const icon = item.querySelector('.benefit-icon-img');
      if (!icon || !key || !BENEFIT_ICON_MAP[key]) return;
      icon.src = BENEFIT_ICON_MAP[key];
    });

    proofItems.forEach((item) => {
      const key = item.dataset.proofKey;
      const icon = item.querySelector('.proof-icon');
      if (!icon || !key || !PROOF_ICON_MAP[key]) return;
      icon.src = PROOF_ICON_MAP[key];
    });

    stepItems.forEach((item) => {
      const key = item.dataset.stepKey;
      const icon = item.querySelector('.step-icon-img');
      if (!icon || !key || !STEP_MAP[key]) return;
      icon.src = STEP_MAP[key];
    });
  }

  function nextAvatar() {
    avatarCursor = (avatarCursor + 1) % AVATAR_POOL.length;
    return AVATAR_POOL[avatarCursor];
  }

  function startLoadingFlow() {
    const duration = MOTION_CONFIG.loadingTimelineMs.openHold[1];
    const started = performance.now();

    timerIds.progress = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const percent = Math.min(100, (elapsed / duration) * 100);

      if (progressValue) progressValue.style.width = `${percent}%`;
      if (loadingProgress) loadingProgress.setAttribute('aria-valuenow', String(Math.round(percent)));
    }, 40);

    timerIds.openPhase = window.setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add('is-open-phase');
      if (loadingStatusText) loadingStatusText.textContent = '红包开启成功，正在进入领取页...';
    }, MOTION_CONFIG.loadingTimelineMs.transition[0]);

    timerIds.reveal = window.setTimeout(() => {
      if (timerIds.progress) window.clearInterval(timerIds.progress);
      revealMainPage();
    }, duration);
  }

  function revealMainPage() {
    if (loadingScreen) {
      loadingScreen.classList.add('is-hidden');
      timerIds.loadingHide = window.setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 320);
    }

    if (mainPage) mainPage.hidden = false;
    if (stickyWrap) stickyWrap.hidden = false;

    if (rewardAmount) rewardAmount.textContent = `¥${randomAmount(5, 10)}`;

    startLiveTicker();
    startClaimCounter();
    startCountdown();
    startWithdrawFeed();
    startProofToast();
    scheduleAutoScroll();
  }

  function startLiveTicker() {
    if (!liveTicker) return;

    const updateTicker = () => {
      const amount = withdrawAmounts[randomInt(0, withdrawAmounts.length - 1)].toFixed(2);
      liveTicker.textContent = `用户 ${buildMaskedUser()} 刚刚提现 ¥${amount}`;

      if (tickerAvatar) {
        tickerAvatar.src = nextAvatar();
        if (!reduceMotion) {
          tickerAvatar.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
        }
      }
    };

    updateTicker();
    timerIds.ticker = window.setInterval(updateTicker, MOTION_CONFIG.tickerIntervalMs);
  }

  function startClaimCounter() {
    if (!claimCount) return;

    timerIds.count = window.setInterval(() => {
      currentClaimCount += randomInt(5, 16);
      claimCount.textContent = currentClaimCount.toLocaleString('en-US');
    }, MOTION_CONFIG.claimCounterIntervalMs);
  }

  function startCountdown() {
    if (!countdown) return;

    countdown.textContent = formatCountdown(remainSeconds);

    timerIds.countdown = window.setInterval(() => {
      remainSeconds -= 1;
      if (remainSeconds < 0) remainSeconds = 119;
      countdown.textContent = formatCountdown(remainSeconds);
    }, MOTION_CONFIG.countdownIntervalMs);
  }

  function createWithdrawRow(row) {
    const li = document.createElement('li');

    const avatar = document.createElement('img');
    avatar.className = 'withdraw-avatar';
    avatar.src = row.avatar;
    avatar.alt = '用户头像';
    avatar.loading = 'lazy';
    avatar.dataset.fallbackClass = 'is-fallback-avatar';

    const userNode = document.createElement('span');
    userNode.className = 'withdraw-user';
    userNode.textContent = `${row.user} 提现`;

    const amountNode = document.createElement('span');
    amountNode.className = 'withdraw-amount';
    amountNode.textContent = `¥${row.amount.toFixed(2)}`;

    li.append(avatar, userNode, amountNode);
    bindImageFallback([avatar]);
    return li;
  }

  function renderWithdrawRows(rows) {
    if (!withdrawList) return;

    withdrawList.replaceChildren();
    rows.forEach((row) => {
      withdrawList.appendChild(createWithdrawRow(row));
    });
  }

  function startWithdrawFeed() {
    const rows = new Array(3).fill(null).map((_value, idx) => ({
      avatar: AVATAR_POOL[idx % AVATAR_POOL.length],
      user: buildMaskedUser(),
      amount: withdrawAmounts[randomInt(0, withdrawAmounts.length - 1)]
    }));

    renderWithdrawRows(rows);

    timerIds.list = window.setInterval(() => {
      rows.unshift({
        avatar: nextAvatar(),
        user: buildMaskedUser(),
        amount: withdrawAmounts[randomInt(0, withdrawAmounts.length - 1)]
      });
      rows.length = 3;
      renderWithdrawRows(rows);
    }, MOTION_CONFIG.withdrawIntervalMs);
  }

  function startProofToast() {
    if (!proofToast) return;

    const updateToast = () => {
      const amount = withdrawAmounts[randomInt(0, withdrawAmounts.length - 1)].toFixed(2);
      proofToast.textContent = `恭喜用户 ${buildMaskedUser()} 刚刚提现 ¥${amount}！`;
    };

    updateToast();
    timerIds.toast = window.setInterval(updateToast, MOTION_CONFIG.proofToastIntervalMs);
  }

  function scheduleAutoScroll() {
    if (!proofCard) return;

    const markInterrupt = () => {
      userInterruptedScroll = true;
      window.removeEventListener('touchstart', markInterrupt);
      window.removeEventListener('wheel', markInterrupt);
      window.removeEventListener('keydown', markInterrupt);
    };

    window.addEventListener('touchstart', markInterrupt, { passive: true });
    window.addEventListener('wheel', markInterrupt, { passive: true });
    window.addEventListener('keydown', markInterrupt);

    timerIds.autoScroll = window.setTimeout(() => {
      if (!userInterruptedScroll) {
        proofCard.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }, 2400);
  }

  function clearTimers() {
    Object.values(timerIds).forEach((id) => {
      if (!id) return;
      window.clearTimeout(id);
      window.clearInterval(id);
    });
  }

  if (reduceMotion && MOTION_CONFIG.reducedMotionPolicy.disableCtaSweep) {
    document.documentElement.style.setProperty('--cta-shine-duration', '1ms');
  }

  applyStaticAssets();
  bindImageFallback(allImages);
  bindCtas();
  preloadCriticalAssets();
  startLoadingFlow();

  window.addEventListener('pagehide', clearTimers);
})();
