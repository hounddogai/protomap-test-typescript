import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReputationTarget } from "./weighted-reputation-target.js";

/** Keeps weighted reputation targets by code. */
export interface WeightedReputationTargetStore {
  find(code: string): WeightedReputationTarget | undefined;
  save(item: WeightedReputationTarget): void;
  remove(code: string): boolean;
  list(): WeightedReputationTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReputationTargetStore implements WeightedReputationTargetStore {
  items: Map<string, WeightedReputationTarget>;
  order: string[];

  constructor(items: Map<string, WeightedReputationTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReputationTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReputationTarget): void {
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

  list(): WeightedReputationTarget[] {
    const out: WeightedReputationTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReputationTargetStore(): WeightedReputationTargetStore {
  return new MemoryWeightedReputationTargetStore(new Map<string, WeightedReputationTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReputationTargetStore implements WeightedReputationTargetStore {
  inner: WeightedReputationTargetStore;
  cache: cache.TtlCache<WeightedReputationTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReputationTargetStore,
    cacheValue: cache.TtlCache<WeightedReputationTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReputationTarget | undefined {
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

  save(item: WeightedReputationTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReputationTarget[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReputationTargetStore(inner: WeightedReputationTargetStore, ttl: number, clockValue: clock.Clock): WeightedReputationTargetStore {
  return new CachedWeightedReputationTargetStore(
    inner,
    cache.newTtlCache<WeightedReputationTarget>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reputation targets. Empty fields match all. */
export class WeightedReputationTargetQuery {
  locale: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSendAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReputationTarget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReputationTarget[]): WeightedReputationTarget[] {
    const matched = collections.filter(items, (candidate: WeightedReputationTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReputationTargets(store: WeightedReputationTargetStore, query: WeightedReputationTargetQuery): WeightedReputationTarget[] {
  return query.apply(store.list());
}
