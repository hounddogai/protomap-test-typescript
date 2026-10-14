import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelQuota } from "./level-quota.js";

/** Keeps level quotas by code. */
export interface LevelQuotaStore {
  find(code: string): LevelQuota | undefined;
  save(item: LevelQuota): void;
  remove(code: string): boolean;
  list(): LevelQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelQuotaStore implements LevelQuotaStore {
  items: Map<string, LevelQuota>;
  order: string[];

  constructor(items: Map<string, LevelQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelQuota): void {
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

  list(): LevelQuota[] {
    const out: LevelQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelQuotaStore(): LevelQuotaStore {
  return new MemoryLevelQuotaStore(new Map<string, LevelQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelQuotaStore implements LevelQuotaStore {
  inner: LevelQuotaStore;
  cache: cache.TtlCache<LevelQuota>;
  hits: number;
  misses: number;

  constructor(inner: LevelQuotaStore, cacheValue: cache.TtlCache<LevelQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelQuota | undefined {
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

  save(item: LevelQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelQuota[] {
    return this.inner.list();
  }
}

export function newCachedLevelQuotaStore(inner: LevelQuotaStore, ttl: number, clockValue: clock.Clock): LevelQuotaStore {
  return new CachedLevelQuotaStore(inner, cache.newTtlCache<LevelQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects level quotas. Empty fields match all. */
export class LevelQuotaQuery {
  locale: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRevision: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelQuota[]): LevelQuota[] {
    const matched = collections.filter(items, (candidate: LevelQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelQuotas(store: LevelQuotaStore, query: LevelQuotaQuery): LevelQuota[] {
  return query.apply(store.list());
}
