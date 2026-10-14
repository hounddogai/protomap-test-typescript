import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredExitRuleDigest } from "./tiered-exit-rule-digest.js";

/** Keeps tiered exit rule digests by code. */
export interface TieredExitRuleDigestStore {
  find(code: string): TieredExitRuleDigest | undefined;
  save(item: TieredExitRuleDigest): void;
  remove(code: string): boolean;
  list(): TieredExitRuleDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredExitRuleDigestStore implements TieredExitRuleDigestStore {
  items: Map<string, TieredExitRuleDigest>;
  order: string[];

  constructor(items: Map<string, TieredExitRuleDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredExitRuleDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredExitRuleDigest): void {
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

  list(): TieredExitRuleDigest[] {
    const out: TieredExitRuleDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredExitRuleDigestStore(): TieredExitRuleDigestStore {
  return new MemoryTieredExitRuleDigestStore(new Map<string, TieredExitRuleDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredExitRuleDigestStore implements TieredExitRuleDigestStore {
  inner: TieredExitRuleDigestStore;
  cache: cache.TtlCache<TieredExitRuleDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredExitRuleDigestStore,
    cacheValue: cache.TtlCache<TieredExitRuleDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredExitRuleDigest | undefined {
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

  save(item: TieredExitRuleDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredExitRuleDigest[] {
    return this.inner.list();
  }
}

export function newCachedTieredExitRuleDigestStore(inner: TieredExitRuleDigestStore, ttl: number, clockValue: clock.Clock): TieredExitRuleDigestStore {
  return new CachedTieredExitRuleDigestStore(
    inner,
    cache.newTtlCache<TieredExitRuleDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered exit rule digests. Empty fields match all. */
export class TieredExitRuleDigestQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredExitRuleDigest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredExitRuleDigest[]): TieredExitRuleDigest[] {
    const matched = collections.filter(items, (candidate: TieredExitRuleDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredExitRuleDigests(store: TieredExitRuleDigestStore, query: TieredExitRuleDigestQuery): TieredExitRuleDigest[] {
  return query.apply(store.list());
}
