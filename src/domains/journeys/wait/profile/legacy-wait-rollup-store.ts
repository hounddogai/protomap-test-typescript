import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWaitRollup } from "./legacy-wait-rollup.js";

/** Keeps legacy wait rollups by code. */
export interface LegacyWaitRollupStore {
  find(code: string): LegacyWaitRollup | undefined;
  save(item: LegacyWaitRollup): void;
  remove(code: string): boolean;
  list(): LegacyWaitRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWaitRollupStore implements LegacyWaitRollupStore {
  items: Map<string, LegacyWaitRollup>;
  order: string[];

  constructor(items: Map<string, LegacyWaitRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWaitRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWaitRollup): void {
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

  list(): LegacyWaitRollup[] {
    const out: LegacyWaitRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWaitRollupStore(): LegacyWaitRollupStore {
  return new MemoryLegacyWaitRollupStore(new Map<string, LegacyWaitRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWaitRollupStore implements LegacyWaitRollupStore {
  inner: LegacyWaitRollupStore;
  cache: cache.TtlCache<LegacyWaitRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWaitRollupStore,
    cacheValue: cache.TtlCache<LegacyWaitRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWaitRollup | undefined {
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

  save(item: LegacyWaitRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWaitRollup[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWaitRollupStore(inner: LegacyWaitRollupStore, ttl: number, clockValue: clock.Clock): LegacyWaitRollupStore {
  return new CachedLegacyWaitRollupStore(inner, cache.newTtlCache<LegacyWaitRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy wait rollups. Empty fields match all. */
export class LegacyWaitRollupQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyWaitRollup): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWaitRollup[]): LegacyWaitRollup[] {
    const matched = collections.filter(items, (candidate: LegacyWaitRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWaitRollups(store: LegacyWaitRollupStore, query: LegacyWaitRollupQuery): LegacyWaitRollup[] {
  return query.apply(store.list());
}
