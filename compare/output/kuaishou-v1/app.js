(() => {
  const DOWNLOAD_URL = 'https://app.mi.com/details?id=com.kuaishou.nebula';

  const ASSETS = {
    logo: '../../input/visuals/kuaishou/logo.png'
  };

  const beatPool = [
    { cta: 1, card: 0 },
    { cta: 1, card: 1 },
    { cta: 2, card: 2 },
    { cta: 3, card: 3 }
  ];

  const tickerPool = [
    '杭州 郑** 29分钟前 领取了 ¥22.88',
    '重庆 吴** 22分钟前 领取了 ¥19.66',
    '深圳 李** 提现成功 +¥18.30',
    '广州 赵** 完成任务 +¥26.50',
    '成都 何** 邀好友到账 +¥31.20'
  ];

  const proofPool = [
    { avatar: '👩', user: '小红**', action: '3分钟前提现成功', money: '+¥38.88' },
    { avatar: '👨', user: '大力**', action: '刚刚提现成功', money: '+¥28.66' },
    { avatar: '🧑', user: '阿北**', action: '1分钟前提现成功', money: '+¥19.30' },
    { avatar: '👩', user: '夏夏**', action: '刚刚提现成功', money: '+¥16.80' },
    { avatar: '👨', user: '老王**', action: '2分钟前提现成功', money: '+¥24.50' },
    { avatar: '🧑', user: '木子**', action: '刚刚提现成功', money: '+¥20.18' }
  ];

  const el = {
    logo: document.getElementById('logoImage'),
    timerMin: document.getElementById('timerMin'),
    timerSec: document.getElementById('timerSec'),
    tickerText: document.getElementById('tickerText'),
    stageCoins: document.getElementById('stageCoins'),
    amountValue: document.getElementById('amountValue'),
    claimCount: document.getElementById('claimCount'),
    proofList: document.getElementById('proofList'),
    cta: document.getElementById('downloadBtn'),
    fxLayer: document.getElementById('fxLayer')
  };

  const state = {
    beatIndex: 0,
    tickerIndex: 0,
    proofIndex: 0,
    countdown: 14 * 60 + 38,
    claimTotal: 328691,
    amountFinal: 38.88
  };

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

  function formatTimer(totalSeconds) {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return [mm, ss];
  }

  function setTimer() {
    const [mm, ss] = formatTimer(state.countdown);
    el.timerMin.textContent = mm;
    el.timerSec.textContent = ss;
  }

  function setCtaLevel(level) {
    el.cta.classList.remove('cta-level-1', 'cta-level-2', 'cta-level-3');
    el.cta.classList.add(`cta-level-${level}`);
  }

  function setActiveCard(cardIndex) {
    document.querySelectorAll('.benefit-card').forEach((card, idx) => {
      card.classList.toggle('is-active', idx === cardIndex);
    });
  }

  function setBeat(index) {
    const beat = beatPool[index % beatPool.length];
    setActiveCard(beat.card);
    setCtaLevel(beat.cta);
  }

  function renderProof() {
    const rows = [];
    for (let i = 0; i < 2; i += 1) {
      rows.push(proofPool[(state.proofIndex + i) % proofPool.length]);
    }
    el.proofList.innerHTML = rows
      .map(
        (row) =>
          `<li><div class="proof-left"><span class="avatar">${row.avatar}</span><span class="user">${row.user} ${row.action}</span></div><div class="proof-right"><p class="money">${row.money}</p><p class="status">已到账 ✔</p></div></li>`
      )
      .join('');
  }

  function setTicker() {
    el.tickerText.textContent = tickerPool[state.tickerIndex % tickerPool.length];
  }

  function animateAmount() {
    const start = performance.now();
    const duration = 1300;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const noise = (1 - progress) * ((Math.random() * 3.2) - 1.6);
      const value = Math.max(8, state.amountFinal + noise);
      el.amountValue.textContent = value.toFixed(2);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.amountValue.textContent = state.amountFinal.toFixed(2);
      }
    };

    requestAnimationFrame(tick);
  }

  function spawnParticles() {
    const root = el.fxLayer;
    if (!root) return;

    for (let i = 0; i < 12; i += 1) {
      const packet = document.createElement('i');
      packet.className = 'packet';
      packet.style.left = `${Math.random() * 100}%`;
      packet.style.animationDuration = `${4 + Math.random() * 3}s`;
      packet.style.animationDelay = `${Math.random() * 2}s`;
      packet.style.opacity = `${0.35 + Math.random() * 0.5}`;
      root.appendChild(packet);
    }

    for (let i = 0; i < 10; i += 1) {
      const coin = document.createElement('i');
      coin.className = 'coin';
      coin.style.left = `${Math.random() * 100}%`;
      coin.style.animationDuration = `${4.8 + Math.random() * 2.8}s`;
      coin.style.animationDelay = `${Math.random() * 2.4}s`;
      coin.style.opacity = `${0.3 + Math.random() * 0.4}`;
      root.appendChild(coin);
    }
  }

  function bindCta() {
    el.cta.addEventListener('click', () => {
      window.location.href = appendParams(DOWNLOAD_URL, el.cta.dataset.source || 'main');
    });
  }

  function bindImageFallback() {
    el.logo.src = resolveAsset(ASSETS.logo);
  }

  function buildStageCoins() {
    const root = el.stageCoins;
    if (!root) return;
    const points = [
      [22, 79, 18, 0.0],
      [34, 76, 21, 0.2],
      [46, 81, 22, 0.45],
      [58, 76, 23, 0.35],
      [70, 80, 20, 0.6],
      [80, 82, 18, 0.75],
      [30, 64, 20, 0.8],
      [42, 58, 19, 0.92],
      [54, 62, 20, 1.1],
      [66, 56, 18, 1.25],
      [78, 60, 19, 0.5],
      [40, 45, 16, 1.05],
      [52, 39, 15, 1.2],
      [62, 33, 14, 1.35]
    ];

    root.innerHTML = points
      .map(
        ([x, y, s, d]) =>
          `<span style=\"left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s\"></span>`
      )
      .join('');
  }

  function startLoops() {
    window.setInterval(() => {
      state.countdown = state.countdown <= 0 ? 14 * 60 + 38 : state.countdown - 1;
      setTimer();
    }, 1000);

    window.setInterval(() => {
      state.tickerIndex = (state.tickerIndex + 1) % tickerPool.length;
      setTicker();
    }, 1800);

    window.setInterval(() => {
      state.proofIndex = (state.proofIndex + 1) % proofPool.length;
      renderProof();
    }, 2200);

    window.setInterval(() => {
      state.claimTotal += Math.floor(Math.random() * 2) + 1;
      el.claimCount.textContent = state.claimTotal.toLocaleString('en-US');
    }, 2400);

    window.setInterval(() => {
      state.beatIndex = (state.beatIndex + 1) % beatPool.length;
      setBeat(state.beatIndex);
    }, 1000);
  }

  function init() {
    bindImageFallback();
    buildStageCoins();
    bindCta();
    setTimer();
    setTicker();
    renderProof();
    setBeat(0);
    spawnParticles();
    animateAmount();
    startLoops();
  }

  init();
})();
