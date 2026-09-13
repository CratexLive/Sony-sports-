window.CricConfig = {
  telegramLink: "https://t.me/+xSqMXDXp78ZiOWQ1",
  previewDuration: 10000
};

class CricXCrateUI extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'closed' });
    this.SENSITIVITY = 2.5;

    // Stream URL sourced from attribute or default configuration
    const configuredUrl = this.getAttribute('stream-url') || "https://sony.freeshow.fun/";
    
    this.masterChannels = [
      { id: "sony-sports-master", title: "Sony Sports Master Feed", url: configuredUrl }
    ];

    this.isStreamUnlocked = false;
    this.lockTimer = null;
    this.animationFrameId = null;
    this.stars = [];
    this.channelSwitchCount = 0;

    this._shadow.innerHTML = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;600;700;800;900&family=Space+Grotesk:wght@500;700;800;900&family=Syne:wght@700;800;900&display=swap" rel="stylesheet">
      <style>
        :host {
          --primary-rgb: 255, 42, 75;
          --accent: rgb(var(--primary-rgb));
          --accent-glow: rgba(var(--primary-rgb), 0.45);
          --accent-glow-intense: rgba(var(--primary-rgb), 0.85);
          --bg-pure: #050508; 
          --bg-card: rgba(18, 12, 15, 0.78);
          --border-glass: rgba(255, 42, 75, 0.2);
          --border-glass-bright: rgba(255, 42, 75, 0.45);
          --heading-dynamic: #ffffff;
          --text-main: #fce8ec;
          --text-muted: #9e8288;
          --text-dark: #5c474c;
          --btn-main-bg: #ffffff;
          --btn-main-text: #050508;
          --player-shadow: 0 45px 120px -20px rgba(255, 42, 75, 0.3);
          display: block; position: relative; width: 100%; min-height: 100vh;
          background: radial-gradient(circle at 50% 0%, rgba(var(--primary-rgb), 0.14) 0%, transparent 60%), var(--bg-pure);
          color: var(--text-main); font-family: 'Manrope', sans-serif; overflow-x: hidden;
          font-size: clamp(14px, 0.8vw + 0.45rem, 22px); box-sizing: border-box;
        }

        :host([data-theme="light"]) {
          --primary-rgb: 230, 20, 55;
          --accent: #e61437;
          --accent-glow: rgba(230, 20, 55, 0.3);
          --bg-pure: #fcf4f5;
          --bg-card: rgba(255, 255, 255, 0.9);
          --border-glass: rgba(0, 0, 0, 0.08);
          --border-glass-bright: rgba(230, 20, 55, 0.3);
          --heading-dynamic: #000000;
          --text-main: #1a080c;
          --text-muted: #6e5258;
          --text-dark: #a88d93;
          --btn-main-bg: #0d0406;
          --btn-main-text: #ffffff;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        #warpGridCanvas { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 0; opacity: 0.85; }
        .container { width: min(1500px, 92vw); margin: 0 auto; padding: 0 0 clamp(40px, 6vw, 100px); position: relative; z-index: 10; }
        .nav { height: clamp(64px, 8.5vh, 96px); display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 50; }
        .brand { display: inline-flex; align-items: center; gap: clamp(10px, 1.2vw, 16px); text-decoration: none; }
        .brand-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(20px, 2.2vw, 28px); font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: var(--heading-dynamic); }

        .nav-actions { display: flex; align-items: center; gap: clamp(8px, 1vw, 14px); }
        .live-pill-badge { height: clamp(32px, 2.8vw, 40px); padding: 0 clamp(12px, 1.2vw, 16px); display: flex; align-items: center; gap: 6px; background: var(--bg-card); border: 1px solid var(--border-glass); backdrop-filter: blur(16px); border-radius: 100px; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: clamp(8px, 0.7vw, 10px); letter-spacing: 1.2px; text-transform: uppercase; }
        .pulsing-live-dot { width: 6px; height: 6px; background: #ff2a4b; border-radius: 50%; box-shadow: 0 0 12px #ff2a4b; animation: liveSignal 1.5s ease-in-out infinite; }
        @keyframes liveSignal { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.8); } }
        
        .nav-join-btn { height: clamp(32px, 2.8vw, 40px); padding: 0 clamp(16px, 1.5vw, 24px); display: inline-flex; align-items: center; justify-content: center; border-radius: 100px; background: var(--btn-main-bg); color: var(--btn-main-text); text-decoration: none; font-family: 'Space Grotesk', sans-serif; font-size: clamp(10.5px, 0.85vw, 13px); font-weight: 800; letter-spacing: 1px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .nav-join-btn:hover { background: var(--accent); color: #fff; box-shadow: 0 0 20px var(--accent-glow); transform: translateY(-2px); }

        .theme-switch-deck { background: var(--bg-card); border: 1px solid var(--border-glass-bright); border-radius: 100px; backdrop-filter: blur(24px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); padding: 3px; display: flex; align-items: center; gap: 3px; }
        .mode-toggle-btn { height: clamp(26px, 2.2vw, 34px); padding: 0 clamp(8px, 0.9vw, 12px); display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: clamp(7px, 0.6vw, 8.5px); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; border-radius: 100px; cursor: pointer; transition: all 0.3s ease; }
        .mode-toggle-btn i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; transition: all 0.3s ease; }
        .mode-toggle-btn.active { background: var(--accent); color: #fff; box-shadow: 0 0 15px var(--accent-glow); }
        .mode-toggle-btn.active i { background: #fff; }

        .hero { position: relative; padding: clamp(10px, 2vw, 30px) 0 clamp(10px, 1.5vw, 20px); }
        .hero-tag { display: inline-flex; align-items: center; gap: 10px; font-family: 'Space Grotesk', sans-serif; color: var(--accent); font-size: clamp(12px, 1.1vw, 15px); font-weight: 800; letter-spacing: 3px; text-transform: uppercase; }
        .hero-tag::before { content: ""; width: clamp(20px, 2.2vw, 34px); height: 2px; background: var(--accent); border-radius: 2px; }
        .hero-headline { margin-top: clamp(6px, 1vw, 14px); font-family: 'Syne', sans-serif; font-size: clamp(30px, 6vw, 80px); line-height: 0.95; letter-spacing: -0.04em; font-weight: 900; text-transform: uppercase; }
        .hero-headline .accent-txt { color: var(--accent); background: linear-gradient(135deg, #ff2a4b 0%, #ff7b00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .track-separator-beam { width: 100%; height: 1px; background: linear-gradient(90deg, var(--accent) 0%, var(--border-glass) 45%, transparent 100%); margin-bottom: clamp(14px, 1.6vw, 22px); }

        .player-rig-box { width: 100%; aspect-ratio: 16/9; position: relative; background: #000; overflow: hidden; border-radius: clamp(14px, 1.8vw, 26px); border: 1px solid var(--border-glass-bright); box-shadow: var(--player-shadow); z-index: 1; }
        iframe#player { width: 100%; height: 100%; border: none; display: block; position: relative; z-index: 2; border-radius: inherit; }
        
        .tg-modal-overlay { position: fixed; inset: 0; background: rgba(2, 4, 8, 0.92); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); z-index: 99999999; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .tg-modal-overlay.show { opacity: 1; pointer-events: all; }
        
        .tg-modal-box { background: var(--bg-card); border: 1px solid var(--border-glass-bright); border-radius: 24px; padding: clamp(24px, 4vw, 40px); text-align: center; max-width: 420px; width: 88%; transform: translateY(30px) scale(0.9); opacity: 0; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(255, 42, 75, 0.05); position: relative; z-index: 99999999; }
        .tg-modal-overlay.show .tg-modal-box { transform: translateY(0) scale(1); opacity: 1; }
        
        .tg-modal-icon { width: 64px; height: 64px; margin: 0 auto 20px; background: rgba(255, 42, 75, 0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 42, 75, 0.3); box-shadow: 0 0 20px rgba(255, 42, 75, 0.25); }
        .tg-modal-icon svg { width: 32px; height: 32px; fill: var(--accent); }
        .tg-modal-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(20px, 2.5vw, 24px); font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -0.02em; text-transform: uppercase; }
        .tg-modal-desc { font-size: clamp(13px, 1.1vw, 15px); color: var(--text-main); line-height: 1.5; margin-bottom: 24px; font-weight: 600; }
        
        .tg-modal-btn-join { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; border-radius: 100px; background: linear-gradient(135deg, #ff2a4b 0%, #ff6a00 100%); color: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(255, 42, 75, 0.4); cursor: pointer; margin-bottom: 12px; }
        .tg-modal-btn-join:hover { transform: translateY(-2px); box-shadow: 0 15px 40px rgba(255, 42, 75, 0.6); filter: brightness(1.1); }
        
        .tg-modal-btn-joined { background: transparent; border: 1px solid var(--border-glass-bright); color: var(--text-muted); font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; border-radius: 100px; cursor: pointer; transition: all 0.3s ease; }
        .tg-modal-btn-joined:hover { border-color: var(--accent); color: var(--text-main); }

        .player-meta-bar { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: clamp(14px, 1.6vw, 22px) 2px 0; flex-wrap: wrap; }
        .stream-title-group { display: flex; flex-direction: column; gap: 4px; }
        .stream-title-group strong { font-family: 'Space Grotesk', sans-serif; font-size: clamp(15px, 1.35vw, 20px); font-weight: 700; letter-spacing: -0.3px; }
        .stream-title-group span { font-family: 'Space Grotesk', sans-serif; color: var(--text-muted); font-size: clamp(9px, 0.75vw, 11px); letter-spacing: 1.2px; font-weight: 600; text-transform: uppercase; }

        .share-action-btn { height: clamp(38px, 3.2vw, 46px); padding: 0 clamp(18px, 1.8vw, 26px); display: inline-flex; align-items: center; gap: 8px; border-radius: 100px; background: linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 42, 75, 0.16) 100%); border: 1px solid var(--accent); color: var(--text-main); font-family: 'Space Grotesk', sans-serif; font-size: clamp(9px, 0.75vw, 11px); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; backdrop-filter: blur(16px); box-shadow: 0 6px 25px var(--accent-glow); transition: all 0.3s ease; }
        .share-action-btn svg { width: 14px; height: 14px; stroke: var(--accent); stroke-width: 2.2; transition: stroke 0.3s ease; }
        .share-action-btn:hover { background: var(--accent); color: #fff; box-shadow: 0 10px 30px var(--accent-glow-intense); transform: translateY(-2px); }
        .share-action-btn:hover svg { stroke: #fff; }

        .community { margin-top: clamp(48px, 7vw, 110px); position: relative; }
        .community-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--border-glass); }
        .comm-tag { font-family: 'Space Grotesk', sans-serif; color: var(--accent); font-size: clamp(12px, 1.1vw, 15px); font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        .community-body { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: end; padding: clamp(24px, 3.5vw, 42px) 0; }
        .comm-heading { font-family: 'Space Grotesk', sans-serif; font-size: clamp(28px, 4.8vw, 72px); line-height: 0.94; letter-spacing: -0.06em; font-weight: 700; max-width: 720px; }
        .comm-heading span { color: var(--text-dark); }
        
        .comm-btn-prime { height: clamp(44px, 3.8vw, 54px); padding: 0 clamp(22px, 2.2vw, 34px); display: inline-flex; align-items: center; gap: 12px; border-radius: 100px; background: var(--btn-main-bg); color: var(--btn-main-text); text-decoration: none; font-family: 'Space Grotesk', sans-serif; font-size: clamp(11px, 0.85vw, 13px); font-weight: 800; letter-spacing: 1.1px; white-space: nowrap; transition: all 0.3s ease; }
        .comm-btn-prime:hover { background: var(--accent); color: #fff; box-shadow: 0 0 25px var(--accent-glow); transform: translateY(-2px); }

        .footer { margin-top: clamp(44px, 6vw, 80px); border-top: 1px solid var(--border-glass); padding: 20px 0 calc(20px + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; color: var(--text-dark); font-family: 'Space Grotesk', sans-serif; font-size: clamp(8.5px, 0.7vw, 10.5px); letter-spacing: 1.2px; text-transform: uppercase; font-weight: 600; }
        .footer strong { color: var(--text-muted); }

        @media (max-width: 680px) {
          .live-pill-badge { display: none; }
          .community-body { grid-template-columns: 1fr; gap: 18px; }
          .comm-btn-prime { width: 100%; justify-content: center; }
          .player-meta-bar { flex-direction: column; align-items: flex-start; }
          .share-action-btn { width: 100%; justify-content: center; }
        }
      </style>
      <canvas id="warpGridCanvas"></canvas>
      <div class="container">
        <header class="nav">
          <a class="brand" href="${window.CricConfig.telegramLink}" target="_blank" rel="noopener">
            <div class="brand-title">CRICXCRATE</div>
          </a>
          <div class="nav-actions">
            <div class="live-pill-badge"><i class="pulsing-live-dot"></i>ON AIR</div>
            <aside class="theme-switch-deck">
              <button class="mode-toggle-btn active" id="themeDarkBtn"><i></i> Obs</button>
              <button class="mode-toggle-btn" id="themeLightBtn"><i></i> Cer</button>
            </aside>
            <a class="nav-join-btn" href="${window.CricConfig.telegramLink}" target="_blank" rel="noopener">JOIN</a>
          </div>
        </header>

        <section class="hero">
          <div class="hero-tag">LIVE BROADCAST</div>
          <h1 class="hero-headline">SONY SPORTS <br><span class="accent-txt">CHANNELS.</span></h1>
        </section>

        <main class="broadcast">
          <div class="track-separator-beam"></div>

          <div class="player-rig-box" id="playerContainer">
            <iframe id="player" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"></iframe>
            
            <div class="tg-modal-overlay" id="tgPremiumModal">
              <div class="tg-modal-box">
                <div class="tg-modal-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.21 3.45-.49.33-.94.49-1.35.48-.45-.01-1.31-.25-1.95-.46-.79-.26-1.42-.4-1.36-.84.03-.23.35-.47.96-.73 3.77-1.64 6.29-2.73 7.55-3.25 3.59-1.49 4.33-1.75 4.81-1.76.11 0 .35.03.48.14.11.09.14.22.15.34-.01.07-.01.19-.02.26z"/></svg>
                </div>
                <h3 class="tg-modal-title">Join for free streaming links</h3>
                <p class="tg-modal-desc">Get instant access to all HD sports feeds and live matches.</p>
                <a class="tg-modal-btn-join" id="tgJoinModalBtn" href="${window.CricConfig.telegramLink}" target="_blank" rel="noopener">JOIN NOW</a>
                <button class="tg-modal-btn-joined" id="tgJoinedBtn">I've Joined</button>
              </div>
            </div>
          </div>

          <div class="player-meta-bar">
            <div class="stream-title-group">
              <strong id="currentChannelTitle">Sony Sports Master Feed</strong>
              <span>CricxCrate Exclusive Access</span>
            </div>
            <button class="share-action-btn" id="btnShare">
              <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              <span id="shareBtnText">SHARE STREAM</span>
            </button>
          </div>
        </main>

        <section class="community">
          <div class="community-header"><div class="comm-tag">CRICXCRATE</div></div>
          <div class="community-body">
            <h2 class="comm-heading">Stay connected.<br><span>Never miss a match.</span></h2>
            <a class="comm-btn-prime" href="${window.CricConfig.telegramLink}" target="_blank" rel="noopener">JOIN COMMUNITY</a>
          </div>
        </section>

        <footer class="footer">
          <span>© 2026 <strong>CRICXCRATE</strong></span>
          <span>NEON SUITE PRO</span>
        </footer>
      </div>
    `;

    this.msgHandler = (e) => {
      if (e.data === 'cricxcrate-playing') {
        if (!this.isStreamUnlocked && !this.lockTimer) {
          this.lockTimer = setTimeout(() => this.triggerLock(), window.CricConfig.previewDuration);
        }
      }
    };
  }

  connectedCallback() {
    this.initWarpField();
    this.initThemeSwitching();
    this.initEventListeners();

    window.addEventListener('message', this.msgHandler);

    // Initialize with the configured master channel
    this.switchChannel(this.masterChannels[0], false);

    setTimeout(() => {
      this.showTelegramPopup();
    }, 400);
  }

  disconnectedCallback() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.lockTimer) clearTimeout(this.lockTimer);
    window.removeEventListener('message', this.msgHandler);
  }

  showTelegramPopup() {
    const modal = this._shadow.getElementById('tgPremiumModal');
    if (modal) {
      modal.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      modal.classList.add('show');
    }
  }

  hideTelegramPopup() {
    const modal = this._shadow.getElementById('tgPremiumModal');
    if (modal) {
      modal.style.transition = 'opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
      modal.classList.remove('show');
    }
  }

  switchChannel(channel) {
    this._shadow.getElementById('currentChannelTitle').textContent = channel.title + ' · Live Broadcast';
    const iframe = this._shadow.getElementById('player');
    iframe.src = channel.url;
  }

  triggerLock() {
    const iframe = this._shadow.getElementById('player');
    try { if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage('cricxcrate-force-pause', '*'); } catch(e){}
    this.showTelegramPopup();
  }

  unlockStream() {
    localStorage.setItem('cricxcrate_unlocked_time', Date.now().toString());
    this.isStreamUnlocked = true;
    this.hideTelegramPopup();
    window.open(window.CricConfig.telegramLink, '_blank', 'noopener');
  }

  initEventListeners() {
    const btnShare = this._shadow.getElementById("btnShare");
    const shareBtnText = this._shadow.getElementById("shareBtnText");
    const joinModalBtn = this._shadow.getElementById("tgJoinModalBtn");
    const joinedBtn = this._shadow.getElementById("tgJoinedBtn");

    joinModalBtn.addEventListener("click", () => this.hideTelegramPopup());
    joinedBtn.addEventListener("click", () => this.hideTelegramPopup());

    btnShare.addEventListener("click", async () => {
      const shareData = {
        title: "CRICXCRATE — Live Stream",
        text: "Watch live Sony channels on CRICXCRATE!",
        url: window.location.href
      };
      try {
        if (navigator.share && /mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent)) {
          await navigator.share(shareData);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          const originalText = shareBtnText.textContent;
          shareBtnText.textContent = "COPIED!";
          setTimeout(() => { shareBtnText.textContent = originalText; }, 1800);
        }
      } catch (err) {}
    });
  }

  initWarpField() {
    const canvas = this._shadow.getElementById('warpGridCanvas');
    const ctx = canvas.getContext('2d');
    this.stars = [];
    const starCount = Math.min(120, Math.floor(window.innerWidth / 12));
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: (Math.random() * 24 + 10) * this.SENSITIVITY * 0.8,
        speed: (Math.random() * 2.5 + 1.2) * this.SENSITIVITY,
        alpha: Math.random() * 0.5 + 0.15
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1.2;
      this.stars.forEach(star => {
        ctx.strokeStyle = `rgba(255, 42, 75, ${star.alpha})`; 
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x + star.length, star.y);
        ctx.stroke();
        star.x += star.speed;
        if (star.x > canvas.width) {
          star.x = -star.length;
          star.y = Math.random() * canvas.height;
        }
      });
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  initThemeSwitching() {
    const darkBtn = this._shadow.getElementById("themeDarkBtn");
    const lightBtn = this._shadow.getElementById("themeLightBtn");
    const setTheme = (mode) => {
      if (mode === "dark") {
        this.removeAttribute("data-theme");
        darkBtn.classList.add("active");
        lightBtn.classList.remove("active");
      } else {
        this.setAttribute("data-theme", "light");
        lightBtn.classList.add("active");
        darkBtn.classList.remove("active");
      }
    };
    darkBtn.addEventListener("click", () => setTheme("dark"));
    lightBtn.addEventListener("click", () => setTheme("light"));
  }
}

customElements.define('cricxcrate-ui', CricXCrateUI);
