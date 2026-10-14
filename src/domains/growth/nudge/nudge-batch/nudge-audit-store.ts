import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeAudit } from "./nudge-audit.js";

/** Keeps nudge audits by code. */
export interface NudgeAuditStore {
  find(code: string): NudgeAudit | undefined;
  save(item: NudgeAudit): void;
  remove(code: string): boolean;
  list(): NudgeAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeAuditStore implements NudgeAuditStore {
  items: Map<string, NudgeAudit>;
  order: string[];

  constructor(items: Map<string, NudgeAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeAudit): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): NudgeAudit[] {
    const out: NudgeAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeAuditStore(): NudgeAuditStore {
  return new MemoryNudgeAuditStore(new Map<string, NudgeAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeAuditStore implements NudgeAuditStore {
  inner: NudgeAuditStore;
  cache: cache.TtlCache<NudgeAudit>;
  hits: number;
  misses: number;

  constructor(inner: NudgeAuditStore, cacheValue: cache.TtlCache<NudgeAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeAudit | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: NudgeAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeAudit[] {
    return this.inner.list();
  }
}

export function newCachedNudgeAuditStore(inner: NudgeAuditStore, ttl: number, clockValue: clock.Clock): NudgeAuditStore {
  return new CachedNudgeAuditStore(inner, cache.newTtlCache<NudgeAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects nudge audits. Empty fields match all. */
export class NudgeAuditQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeAudit[]): NudgeAudit[] {
    const matched = collections.filter(items, (candidate: NudgeAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeAudits(store: NudgeAuditStore, query: NudgeAuditQuery): NudgeAudit[] {
  return query.apply(store.list());
}
