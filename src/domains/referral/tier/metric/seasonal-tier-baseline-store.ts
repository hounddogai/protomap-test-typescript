import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalTierBaseline } from "./seasonal-tier-baseline.js";

/** Keeps seasonal tier baselines by code. */
export interface SeasonalTierBaselineStore {
  find(code: string): SeasonalTierBaseline | undefined;
  save(item: SeasonalTierBaseline): void;
  remove(code: string): boolean;
  list(): SeasonalTierBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalTierBaselineStore implements SeasonalTierBaselineStore {
  items: Map<string, SeasonalTierBaseline>;
  order: string[];

  constructor(items: Map<string, SeasonalTierBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalTierBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalTierBaseline): void {
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

  list(): SeasonalTierBaseline[] {
    const out: SeasonalTierBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalTierBaselineStore(): SeasonalTierBaselineStore {
  return new MemorySeasonalTierBaselineStore(new Map<string, SeasonalTierBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalTierBaselineStore implements SeasonalTierBaselineStore {
  inner: SeasonalTierBaselineStore;
  cache: cache.TtlCache<SeasonalTierBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalTierBaselineStore,
    cacheValue: cache.TtlCache<SeasonalTierBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalTierBaseline | undefined {
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

  save(item: SeasonalTierBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalTierBaseline[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalTierBaselineStore(inner: SeasonalTierBaselineStore, ttl: number, clockValue: clock.Clock): SeasonalTierBaselineStore {
  return new CachedSeasonalTierBaselineStore(
    inner,
    cache.newTtlCache<SeasonalTierBaseline>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal tier baselines. Empty fields match all. */
export class SeasonalTierBaselineQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalTierBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalTierBaseline[]): SeasonalTierBaseline[] {
    const matched = collections.filter(items, (candidate: SeasonalTierBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalTierBaselines(store: SeasonalTierBaselineStore, query: SeasonalTierBaselineQuery): SeasonalTierBaseline[] {
  return query.apply(store.list());
}
