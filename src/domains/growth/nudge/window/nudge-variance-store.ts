import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeVariance } from "./nudge-variance.js";

/** Keeps nudge variances by code. */
export interface NudgeVarianceStore {
  find(code: string): NudgeVariance | undefined;
  save(item: NudgeVariance): void;
  remove(code: string): boolean;
  list(): NudgeVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeVarianceStore implements NudgeVarianceStore {
  items: Map<string, NudgeVariance>;
  order: string[];

  constructor(items: Map<string, NudgeVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeVariance): void {
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

  list(): NudgeVariance[] {
    const out: NudgeVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeVarianceStore(): NudgeVarianceStore {
  return new MemoryNudgeVarianceStore(new Map<string, NudgeVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeVarianceStore implements NudgeVarianceStore {
  inner: NudgeVarianceStore;
  cache: cache.TtlCache<NudgeVariance>;
  hits: number;
  misses: number;

  constructor(inner: NudgeVarianceStore, cacheValue: cache.TtlCache<NudgeVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeVariance | undefined {
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

  save(item: NudgeVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeVariance[] {
    return this.inner.list();
  }
}

export function newCachedNudgeVarianceStore(inner: NudgeVarianceStore, ttl: number, clockValue: clock.Clock): NudgeVarianceStore {
  return new CachedNudgeVarianceStore(inner, cache.newTtlCache<NudgeVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects nudge variances. Empty fields match all. */
export class NudgeVarianceQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeVariance[]): NudgeVariance[] {
    const matched = collections.filter(items, (candidate: NudgeVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeVariances(store: NudgeVarianceStore, query: NudgeVarianceQuery): NudgeVariance[] {
  return query.apply(store.list());
}
