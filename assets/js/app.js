(() => {
  const body = document.body;
  const downloadBase = body.dataset.downloadUrl || 'https://example.com/app-download';

  const heroScreen = document.getElementById('heroScreen');
  const switchPills = [...document.querySelectorAll('.switch-pill')];
  const counters = [...document.querySelectorAll('.counter[data-target]')];
  const timer = document.getElementById('timer');
  const stickyTimer = document.getElementById('stickyTimer');
  const ctaButtons = [...document.querySelectorAll('[data-cta]')];
  const scrollButtons = [...document.querySelectorAll('[data-scroll-target]')];
  const reveals = [...document.querySelectorAll('.reveal')];

  function safeBuildUrl(source) {
    try {
      const out = new URL(downloadBase, window.location.href);
      const input = new URL(window.location.href);
      const passthrough = ['src', 'campaign', 'channel'];

      out.searchParams.set('lp_source', source || 'unknown');
      passthrough.forEach((key) => {
        const value = input.searchParams.get(key);
        if (value) out.searchParams.set(key, value);
      });
      return out.toString();
    } catch (error) {
      return downloadBase;
    }
  }

  function bindCtas() {
    ctaButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const source = btn.dataset.cta || 'unknown';
        const url = safeBuildUrl(source);
        window.location.href = url;
      });
    });

    scrollButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selector = btn.dataset.scrollTarget;
        const target = selector ? document.querySelector(selector) : null;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function activatePill(nextBtn) {
    if (!nextBtn || !heroScreen) return;

    const nextSrc = nextBtn.dataset.screen;
    const nextLabel = nextBtn.dataset.label || '应用截图预览';
    if (!nextSrc) return;

    heroScreen.style.opacity = '0.2';

    window.setTimeout(() => {
      heroScreen.src = nextSrc;
      heroScreen.alt = `NovaFlow 截图：${nextLabel}`;
      heroScreen.style.opacity = '1';
    }, 120);

    switchPills.forEach((btn) => {
      const active = btn === nextBtn;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function bindScreenSwitch() {
    if (!switchPills.length) return;

    switchPills.forEach((btn) => {
      btn.addEventListener('click', () => activatePill(btn));
    });

    let index = 0;
    window.setInterval(() => {
      index = (index + 1) % switchPills.length;
      activatePill(switchPills[index]);
    }, 4200);
  }

  function animateCounter(el) {
    const rawTarget = Number(el.dataset.target || '0');
    if (!Number.isFinite(rawTarget) || rawTarget <= 0) {
      el.textContent = '0';
      return;
    }

    const isDecimal = !Number.isInteger(rawTarget);
    const start = performance.now();
    const duration = 1300;

    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = rawTarget * eased;
      el.textContent = isDecimal ? current.toFixed(1) : String(Math.floor(current));

      if (progress < 1) {
        window.requestAnimationFrame(frame);
      } else {
        el.textContent = isDecimal ? rawTarget.toFixed(1) : String(Math.round(rawTarget));
      }
    };

    window.requestAnimationFrame(frame);
  }

  function bindCounterAnimation() {
    if (!counters.length) return;

    const seen = new WeakSet();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || seen.has(entry.target)) return;
          seen.add(entry.target);
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  function bindReveal() {
    if (!reveals.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      reveals.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  function startCountdown(totalSeconds) {
    let remain = totalSeconds;

    const tick = () => {
      const min = String(Math.floor(remain / 60)).padStart(2, '0');
      const sec = String(remain % 60).padStart(2, '0');
      const output = `${min}:${sec}`;

      if (timer) timer.textContent = output;
      if (stickyTimer) stickyTimer.textContent = output;

      remain = remain > 0 ? remain - 1 : totalSeconds;
    };

    tick();
    window.setInterval(tick, 1000);
  }

  bindCtas();
  bindScreenSwitch();
  bindCounterAnimation();
  bindReveal();
  startCountdown(14 * 60 + 59);
})();
