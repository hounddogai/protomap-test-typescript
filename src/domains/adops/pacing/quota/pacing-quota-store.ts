import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingQuota } from "./pacing-quota.js";

/** Keeps pacing quotas by code. */
export interface PacingQuotaStore {
  find(code: string): PacingQuota | undefined;
  save(item: PacingQuota): void;
  remove(code: string): boolean;
  list(): PacingQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingQuotaStore implements PacingQuotaStore {
  items: Map<string, PacingQuota>;
  order: string[];

  constructor(items: Map<string, PacingQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingQuota): void {
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

  list(): PacingQuota[] {
    const out: PacingQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingQuotaStore(): PacingQuotaStore {
  return new MemoryPacingQuotaStore(new Map<string, PacingQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingQuotaStore implements PacingQuotaStore {
  inner: PacingQuotaStore;
  cache: cache.TtlCache<PacingQuota>;
  hits: number;
  misses: number;

  constructor(inner: PacingQuotaStore, cacheValue: cache.TtlCache<PacingQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingQuota | undefined {
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

  save(item: PacingQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingQuota[] {
    return this.inner.list();
  }
}

export function newCachedPacingQuotaStore(inner: PacingQuotaStore, ttl: number, clockValue: clock.Clock): PacingQuotaStore {
  return new CachedPacingQuotaStore(inner, cache.newTtlCache<PacingQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects pacing quotas. Empty fields match all. */
export class PacingQuotaQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingQuota[]): PacingQuota[] {
    const matched = collections.filter(items, (candidate: PacingQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingQuotas(store: PacingQuotaStore, query: PacingQuotaQuery): PacingQuota[] {
  return query.apply(store.list());
}
