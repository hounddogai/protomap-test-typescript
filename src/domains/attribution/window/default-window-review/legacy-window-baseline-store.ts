import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWindowBaseline } from "./legacy-window-baseline.js";

/** Keeps legacy window baselines by code. */
export interface LegacyWindowBaselineStore {
  find(code: string): LegacyWindowBaseline | undefined;
  save(item: LegacyWindowBaseline): void;
  remove(code: string): boolean;
  list(): LegacyWindowBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWindowBaselineStore implements LegacyWindowBaselineStore {
  items: Map<string, LegacyWindowBaseline>;
  order: string[];

  constructor(items: Map<string, LegacyWindowBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWindowBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWindowBaseline): void {
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

  list(): LegacyWindowBaseline[] {
    const out: LegacyWindowBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWindowBaselineStore(): LegacyWindowBaselineStore {
  return new MemoryLegacyWindowBaselineStore(new Map<string, LegacyWindowBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWindowBaselineStore implements LegacyWindowBaselineStore {
  inner: LegacyWindowBaselineStore;
  cache: cache.TtlCache<LegacyWindowBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWindowBaselineStore,
    cacheValue: cache.TtlCache<LegacyWindowBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWindowBaseline | undefined {
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

  save(item: LegacyWindowBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWindowBaseline[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWindowBaselineStore(inner: LegacyWindowBaselineStore, ttl: number, clockValue: clock.Clock): LegacyWindowBaselineStore {
  return new CachedLegacyWindowBaselineStore(
    inner,
    cache.newTtlCache<LegacyWindowBaseline>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy window baselines. Empty fields match all. */
export class LegacyWindowBaselineQuery {
  utmSource: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBudget: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyWindowBaseline): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWindowBaseline[]): LegacyWindowBaseline[] {
    const matched = collections.filter(items, (candidate: LegacyWindowBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWindowBaselines(store: LegacyWindowBaselineStore, query: LegacyWindowBaselineQuery): LegacyWindowBaseline[] {
  return query.apply(store.list());
}
