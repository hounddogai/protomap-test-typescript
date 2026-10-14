import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalBadgeBaseline } from "./seasonal-badge-baseline.js";

/** Keeps seasonal badge baselines by code. */
export interface SeasonalBadgeBaselineStore {
  find(code: string): SeasonalBadgeBaseline | undefined;
  save(item: SeasonalBadgeBaseline): void;
  remove(code: string): boolean;
  list(): SeasonalBadgeBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalBadgeBaselineStore implements SeasonalBadgeBaselineStore {
  items: Map<string, SeasonalBadgeBaseline>;
  order: string[];

  constructor(items: Map<string, SeasonalBadgeBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalBadgeBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalBadgeBaseline): void {
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

  list(): SeasonalBadgeBaseline[] {
    const out: SeasonalBadgeBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalBadgeBaselineStore(): SeasonalBadgeBaselineStore {
  return new MemorySeasonalBadgeBaselineStore(new Map<string, SeasonalBadgeBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalBadgeBaselineStore implements SeasonalBadgeBaselineStore {
  inner: SeasonalBadgeBaselineStore;
  cache: cache.TtlCache<SeasonalBadgeBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalBadgeBaselineStore,
    cacheValue: cache.TtlCache<SeasonalBadgeBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalBadgeBaseline | undefined {
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

  save(item: SeasonalBadgeBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalBadgeBaseline[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalBadgeBaselineStore(inner: SeasonalBadgeBaselineStore, ttl: number, clockValue: clock.Clock): SeasonalBadgeBaselineStore {
  return new CachedSeasonalBadgeBaselineStore(
    inner,
    cache.newTtlCache<SeasonalBadgeBaseline>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal badge baselines. Empty fields match all. */
export class SeasonalBadgeBaselineQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalBadgeBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalBadgeBaseline[]): SeasonalBadgeBaseline[] {
    const matched = collections.filter(items, (candidate: SeasonalBadgeBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalBadgeBaselines(store: SeasonalBadgeBaselineStore, query: SeasonalBadgeBaselineQuery): SeasonalBadgeBaseline[] {
  return query.apply(store.list());
}
