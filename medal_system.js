// medal_system.js —— 生涯击杀勋章状态与本地持久化
// 只处理数据，不依赖 HUD、Canvas 或小红书 SDK；界面和分享失败不能影响击杀进度。
(function (root) {
  'use strict';

  const SCHEMA_VERSION = 1;

  function freshState() {
    return { version: SCHEMA_VERSION, careerKills: 0, announcedMedals: [] };
  }

  function normalizeMedals(input) {
    const seen = new Set();
    return (Array.isArray(input) ? input : [])
      .filter((medal) => medal && typeof medal.id === 'string' && medal.id &&
        Number.isSafeInteger(medal.kills) && medal.kills > 0 && !seen.has(medal.id) && seen.add(medal.id))
      .map((medal) => Object.freeze({ ...medal }))
      .sort((a, b) => a.kills - b.kills);
  }

  function sanitizeState(value, medalIds) {
    if (!value || typeof value !== 'object') return freshState();
    const rawKills = Number(value.careerKills);
    const careerKills = Number.isSafeInteger(rawKills) && rawKills >= 0 ? rawKills : 0;
    const announced = Array.isArray(value.announcedMedals) ? value.announcedMedals : [];
    return {
      version: SCHEMA_VERSION,
      careerKills,
      announcedMedals: Array.from(new Set(announced.filter((id) => medalIds.has(id)))),
    };
  }

  class MedalSystem {
    constructor(options = {}) {
      this.medals = normalizeMedals(options.medals);
      if (!this.medals.length) throw new Error('MedalSystem requires at least one valid medal');
      this.storageKey = options.storageKey || 'cs15_medals_v1';
      this._medalIds = new Set(this.medals.map((medal) => medal.id));
      this._storage = null;
      this.persistenceAvailable = true;
      try {
        this._storage = options.storage !== undefined ? options.storage : root.localStorage;
      } catch (error) {
        this.persistenceAvailable = false;
      }
      this.state = this._load();
    }

    _load() {
      if (!this._storage || typeof this._storage.getItem !== 'function') {
        this.persistenceAvailable = false;
        return freshState();
      }
      try {
        const raw = this._storage.getItem(this.storageKey);
        return raw ? sanitizeState(JSON.parse(raw), this._medalIds) : freshState();
      } catch (error) {
        this.persistenceAvailable = false;
        return freshState();
      }
    }

    _save() {
      if (!this._storage || typeof this._storage.setItem !== 'function') {
        this.persistenceAvailable = false;
        return false;
      }
      try {
        this._storage.setItem(this.storageKey, JSON.stringify(this.state));
        this.persistenceAvailable = true;
        return true;
      } catch (error) {
        this.persistenceAvailable = false;
        return false;
      }
    }

    recordKill(metadata = {}) {
      const previousKills = this.state.careerKills;
      const nextKills = Math.min(Number.MAX_SAFE_INTEGER, previousKills + 1);
      this.state.careerKills = nextKills;
      const unlocked = this.medals.filter((medal) => previousKills < medal.kills && nextKills >= medal.kills);
      this._save();
      return {
        previousKills,
        careerKills: nextKills,
        unlocked,
        metadata: { ...metadata },
        persisted: this.persistenceAvailable,
      };
    }

    markAnnounced(id) {
      if (!this._medalIds.has(id) || this.state.announcedMedals.includes(id)) return false;
      this.state.announcedMedals.push(id);
      this._save();
      return true;
    }

    pendingAnnouncements() {
      const announced = new Set(this.state.announcedMedals);
      return this.medals.filter((medal) => medal.kills <= this.state.careerKills && !announced.has(medal.id));
    }

    getMedal(id) {
      return this.medals.find((medal) => medal.id === id) || null;
    }

    getProgress() {
      const kills = this.state.careerKills;
      return this.medals.map((medal) => ({ ...medal, unlocked: kills >= medal.kills }));
    }

    getNextMedal() {
      return this.medals.find((medal) => this.state.careerKills < medal.kills) || null;
    }

    snapshot() {
      return {
        version: SCHEMA_VERSION,
        careerKills: this.state.careerKills,
        announcedMedals: this.state.announcedMedals.slice(),
        persistenceAvailable: this.persistenceAvailable,
      };
    }
  }

  root.MedalSystem = MedalSystem;
  root.CS15MedalState = Object.freeze({ SCHEMA_VERSION, freshState, sanitizeState });
})(typeof window !== 'undefined' ? window : globalThis);
