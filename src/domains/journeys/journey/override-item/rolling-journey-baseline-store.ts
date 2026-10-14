import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingJourneyBaseline } from "./rolling-journey-baseline.js";

/** Keeps rolling journey baselines by code. */
export interface RollingJourneyBaselineStore {
  find(code: string): RollingJourneyBaseline | undefined;
  save(item: RollingJourneyBaseline): void;
  remove(code: string): boolean;
  list(): RollingJourneyBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingJourneyBaselineStore implements RollingJourneyBaselineStore {
  items: Map<string, RollingJourneyBaseline>;
  order: string[];

  constructor(items: Map<string, RollingJourneyBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingJourneyBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingJourneyBaseline): void {
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

  list(): RollingJourneyBaseline[] {
    const out: RollingJourneyBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingJourneyBaselineStore(): RollingJourneyBaselineStore {
  return new MemoryRollingJourneyBaselineStore(new Map<string, RollingJourneyBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingJourneyBaselineStore implements RollingJourneyBaselineStore {
  inner: RollingJourneyBaselineStore;
  cache: cache.TtlCache<RollingJourneyBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingJourneyBaselineStore,
    cacheValue: cache.TtlCache<RollingJourneyBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingJourneyBaseline | undefined {
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

  save(item: RollingJourneyBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingJourneyBaseline[] {
    return this.inner.list();
  }
}

export function newCachedRollingJourneyBaselineStore(inner: RollingJourneyBaselineStore, ttl: number, clockValue: clock.Clock): RollingJourneyBaselineStore {
  return new CachedRollingJourneyBaselineStore(
    inner,
    cache.newTtlCache<RollingJourneyBaseline>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling journey baselines. Empty fields match all. */
export class RollingJourneyBaselineQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingJourneyBaseline): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingJourneyBaseline[]): RollingJourneyBaseline[] {
    const matched = collections.filter(items, (candidate: RollingJourneyBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingJourneyBaselines(store: RollingJourneyBaselineStore, query: RollingJourneyBaselineQuery): RollingJourneyBaseline[] {
  return query.apply(store.list());
}
