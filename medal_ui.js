// medal_ui.js —— 勋章中心、结算摘要和非阻塞解锁提示
(function (root) {
  'use strict';

  class MedalUI {
    constructor(options) {
      this.system = options.system;
      this.audio = options.audio || null;
      this.bindTap = options.bindTap;
      this.onShare = options.onShare;
      this.center = document.getElementById('medalCenter');
      this.grid = document.getElementById('medalGrid');
      this.careerSummary = document.getElementById('medalCareerSummary');
      this.resultSummary = document.getElementById('resultMedalSummary');
      this.banner = document.getElementById('medalUnlockBanner');
      this.bannerImage = document.getElementById('medalUnlockImage');
      this.bannerTitle = document.getElementById('medalUnlockTitle');
      this.bannerProgress = document.getElementById('medalUnlockProgress');
      this._unlockQueue = [];
      this._unlockTimer = 0;
    }

    openCenter() {
      this.renderCenter();
      if (this.center) {
        this.center.scrollTop = 0;
        this.center.classList.remove('hidden');
      }
    }

    closeCenter() {
      if (this.center) this.center.classList.add('hidden');
    }

    renderCenter() {
      if (!this.grid) return;
      const snapshot = this.system.snapshot();
      const next = this.system.getNextMedal();
      if (this.careerSummary) {
        this.careerSummary.textContent = next
          ? `生涯击杀 ${snapshot.careerKills} · 下一枚 ${next.title} ${next.kills - snapshot.careerKills} 击杀后解锁`
          : `生涯击杀 ${snapshot.careerKills} · 六枚勋章已全部解锁`;
      }

      this.grid.replaceChildren();
      for (const medal of this.system.getProgress()) {
        const card = document.createElement('article');
        card.className = `medal-card ${medal.unlocked ? 'unlocked' : 'locked'}`;
        card.dataset.medalId = medal.id;
        card.style.setProperty('--medal-accent', medal.accent || '#3d8996');

        const visual = document.createElement('div');
        visual.className = 'medal-card-visual';
        const image = document.createElement('img');
        image.className = 'medal-card-image';
        image.src = medal.image;
        image.alt = medal.unlocked ? medal.title : `未解锁勋章：${medal.title}`;
        image.loading = 'lazy';
        image.decoding = 'async';
        visual.appendChild(image);
        card.appendChild(visual);

        const title = document.createElement('h3');
        title.className = 'medal-card-title';
        title.textContent = medal.title;
        card.appendChild(title);

        const requirement = document.createElement('p');
        requirement.className = 'medal-card-requirement';
        requirement.textContent = medal.unlocked
          ? `${medal.kills} 击杀达成`
          : `${Math.min(snapshot.careerKills, medal.kills)} / ${medal.kills} 击杀`;
        card.appendChild(requirement);

        const track = document.createElement('div');
        track.className = 'medal-card-progress-track';
        const fill = document.createElement('span');
        fill.className = 'medal-card-progress-bar';
        fill.style.width = `${Math.min(100, snapshot.careerKills / medal.kills * 100)}%`;
        track.appendChild(fill);
        card.appendChild(track);

        if (medal.unlocked) {
          const share = document.createElement('button');
          share.type = 'button';
          share.className = 'medal-card-share btn btn-ghost';
          share.textContent = '生成分享卡';
          if (typeof this.bindTap === 'function') {
            this.bindTap(share, () => {
              if (typeof this.onShare === 'function') this.onShare(medal);
            });
          }
          card.appendChild(share);
        }
        this.grid.appendChild(card);
      }
    }

    setResult(unlockedIds) {
      if (!this.resultSummary) return;
      const medals = (Array.isArray(unlockedIds) ? unlockedIds : [])
        .map((id) => this.system.getMedal(id))
        .filter(Boolean);
      this.resultSummary.replaceChildren();
      if (!medals.length) {
        const next = this.system.getNextMedal();
        if (!next) {
          this.resultSummary.textContent = '六枚生涯勋章已全部解锁';
          this.resultSummary.classList.remove('hidden');
          return;
        }
        const kills = this.system.snapshot().careerKills;
        this.resultSummary.textContent = `下一枚：${next.title} · ${kills} / ${next.kills}`;
        this.resultSummary.classList.remove('hidden');
        return;
      }

      const label = document.createElement('span');
      label.textContent = '本局解锁：';
      this.resultSummary.appendChild(label);
      for (const medal of medals) {
        const item = document.createElement('strong');
        item.textContent = medal.title;
        item.style.color = medal.accent || '#f5b53a';
        this.resultSummary.appendChild(item);
      }
      this.resultSummary.classList.remove('hidden');
    }

    queueUnlocks(medals) {
      for (const medal of Array.isArray(medals) ? medals : []) {
        if (!medal || this._unlockQueue.some((item) => item.id === medal.id)) continue;
        this._unlockQueue.push(medal);
      }
      if (!this._unlockTimer) this._showNextUnlock();
    }

    _showNextUnlock() {
      const medal = this._unlockQueue.shift();
      if (!medal || !this.banner) {
        this._unlockTimer = 0;
        return;
      }
      if (this.bannerImage) {
        this.bannerImage.src = medal.image;
        this.bannerImage.alt = medal.title;
      }
      if (this.bannerTitle) this.bannerTitle.textContent = `勋章解锁 · ${medal.title}`;
      if (this.bannerProgress) this.bannerProgress.textContent = `生涯击杀达到 ${medal.kills} · 回合结束后可分享`;
      this.banner.classList.remove('hidden');
      this.system.markAnnounced(medal.id);
      if (this.audio && typeof this.audio.medalUnlock === 'function') this.audio.medalUnlock();

      this._unlockTimer = root.setTimeout(() => {
        this.banner.classList.add('hidden');
        this._unlockTimer = 0;
        this._showNextUnlock();
      }, 2800);
    }
  }

  root.MedalUI = MedalUI;
})(typeof window !== 'undefined' ? window : globalThis);
