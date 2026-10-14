import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleDigest } from "./weighted-reward-rule-digest.js";

/** Keeps weighted reward rule digests by code. */
export interface WeightedRewardRuleDigestStore {
  find(code: string): WeightedRewardRuleDigest | undefined;
  save(item: WeightedRewardRuleDigest): void;
  remove(code: string): boolean;
  list(): WeightedRewardRuleDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardRuleDigestStore implements WeightedRewardRuleDigestStore {
  items: Map<string, WeightedRewardRuleDigest>;
  order: string[];

  constructor(items: Map<string, WeightedRewardRuleDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardRuleDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardRuleDigest): void {
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

  list(): WeightedRewardRuleDigest[] {
    const out: WeightedRewardRuleDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardRuleDigestStore(): WeightedRewardRuleDigestStore {
  return new MemoryWeightedRewardRuleDigestStore(new Map<string, WeightedRewardRuleDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardRuleDigestStore implements WeightedRewardRuleDigestStore {
  inner: WeightedRewardRuleDigestStore;
  cache: cache.TtlCache<WeightedRewardRuleDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardRuleDigestStore,
    cacheValue: cache.TtlCache<WeightedRewardRuleDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardRuleDigest | undefined {
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

  save(item: WeightedRewardRuleDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardRuleDigest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardRuleDigestStore(inner: WeightedRewardRuleDigestStore, ttl: number, clockValue: clock.Clock): WeightedRewardRuleDigestStore {
  return new CachedWeightedRewardRuleDigestStore(
    inner,
    cache.newTtlCache<WeightedRewardRuleDigest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward rule digests. Empty fields match all. */
export class WeightedRewardRuleDigestQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardRuleDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardRuleDigest[]): WeightedRewardRuleDigest[] {
    const matched = collections.filter(items, (candidate: WeightedRewardRuleDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardRuleDigests(store: WeightedRewardRuleDigestStore, query: WeightedRewardRuleDigestQuery): WeightedRewardRuleDigest[] {
  return query.apply(store.list());
}
