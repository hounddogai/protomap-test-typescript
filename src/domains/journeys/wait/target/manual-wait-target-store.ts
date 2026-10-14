import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualWaitTarget } from "./manual-wait-target.js";

/** Keeps manual wait targets by code. */
export interface ManualWaitTargetStore {
  find(code: string): ManualWaitTarget | undefined;
  save(item: ManualWaitTarget): void;
  remove(code: string): boolean;
  list(): ManualWaitTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualWaitTargetStore implements ManualWaitTargetStore {
  items: Map<string, ManualWaitTarget>;
  order: string[];

  constructor(items: Map<string, ManualWaitTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualWaitTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualWaitTarget): void {
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

  list(): ManualWaitTarget[] {
    const out: ManualWaitTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualWaitTargetStore(): ManualWaitTargetStore {
  return new MemoryManualWaitTargetStore(new Map<string, ManualWaitTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualWaitTargetStore implements ManualWaitTargetStore {
  inner: ManualWaitTargetStore;
  cache: cache.TtlCache<ManualWaitTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualWaitTargetStore,
    cacheValue: cache.TtlCache<ManualWaitTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualWaitTarget | undefined {
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

  save(item: ManualWaitTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualWaitTarget[] {
    return this.inner.list();
  }
}

export function newCachedManualWaitTargetStore(inner: ManualWaitTargetStore, ttl: number, clockValue: clock.Clock): ManualWaitTargetStore {
  return new CachedManualWaitTargetStore(inner, cache.newTtlCache<ManualWaitTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects manual wait targets. Empty fields match all. */
export class ManualWaitTargetQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualWaitTarget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualWaitTarget[]): ManualWaitTarget[] {
    const matched = collections.filter(items, (candidate: ManualWaitTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualWaitTargets(store: ManualWaitTargetStore, query: ManualWaitTargetQuery): ManualWaitTarget[] {
  return query.apply(store.list());
}
