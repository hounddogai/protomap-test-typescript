import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPacingRollup } from "./legacy-pacing-rollup.js";

/** Keeps legacy pacing rollups by code. */
export interface LegacyPacingRollupStore {
  find(code: string): LegacyPacingRollup | undefined;
  save(item: LegacyPacingRollup): void;
  remove(code: string): boolean;
  list(): LegacyPacingRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPacingRollupStore implements LegacyPacingRollupStore {
  items: Map<string, LegacyPacingRollup>;
  order: string[];

  constructor(items: Map<string, LegacyPacingRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPacingRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPacingRollup): void {
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

  list(): LegacyPacingRollup[] {
    const out: LegacyPacingRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPacingRollupStore(): LegacyPacingRollupStore {
  return new MemoryLegacyPacingRollupStore(new Map<string, LegacyPacingRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPacingRollupStore implements LegacyPacingRollupStore {
  inner: LegacyPacingRollupStore;
  cache: cache.TtlCache<LegacyPacingRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPacingRollupStore,
    cacheValue: cache.TtlCache<LegacyPacingRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPacingRollup | undefined {
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

  save(item: LegacyPacingRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPacingRollup[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPacingRollupStore(inner: LegacyPacingRollupStore, ttl: number, clockValue: clock.Clock): LegacyPacingRollupStore {
  return new CachedLegacyPacingRollupStore(inner, cache.newTtlCache<LegacyPacingRollup>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy pacing rollups. Empty fields match all. */
export class LegacyPacingRollupQuery {
  category: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBid: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPacingRollup): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPacingRollup[]): LegacyPacingRollup[] {
    const matched = collections.filter(items, (candidate: LegacyPacingRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPacingRollups(store: LegacyPacingRollupStore, query: LegacyPacingRollupQuery): LegacyPacingRollup[] {
  return query.apply(store.list());
}
