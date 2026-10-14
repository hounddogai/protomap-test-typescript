import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryFunnelBaseline } from "./primary-funnel-baseline.js";

/** Keeps primary funnel baselines by code. */
export interface PrimaryFunnelBaselineStore {
  find(code: string): PrimaryFunnelBaseline | undefined;
  save(item: PrimaryFunnelBaseline): void;
  remove(code: string): boolean;
  list(): PrimaryFunnelBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryFunnelBaselineStore implements PrimaryFunnelBaselineStore {
  items: Map<string, PrimaryFunnelBaseline>;
  order: string[];

  constructor(items: Map<string, PrimaryFunnelBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryFunnelBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryFunnelBaseline): void {
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

  list(): PrimaryFunnelBaseline[] {
    const out: PrimaryFunnelBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryFunnelBaselineStore(): PrimaryFunnelBaselineStore {
  return new MemoryPrimaryFunnelBaselineStore(new Map<string, PrimaryFunnelBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryFunnelBaselineStore implements PrimaryFunnelBaselineStore {
  inner: PrimaryFunnelBaselineStore;
  cache: cache.TtlCache<PrimaryFunnelBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryFunnelBaselineStore,
    cacheValue: cache.TtlCache<PrimaryFunnelBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryFunnelBaseline | undefined {
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

  save(item: PrimaryFunnelBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryFunnelBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryFunnelBaselineStore(inner: PrimaryFunnelBaselineStore, ttl: number, clockValue: clock.Clock): PrimaryFunnelBaselineStore {
  return new CachedPrimaryFunnelBaselineStore(
    inner,
    cache.newTtlCache<PrimaryFunnelBaseline>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary funnel baselines. Empty fields match all. */
export class PrimaryFunnelBaselineQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryFunnelBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryFunnelBaseline[]): PrimaryFunnelBaseline[] {
    const matched = collections.filter(items, (candidate: PrimaryFunnelBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryFunnelBaselines(store: PrimaryFunnelBaselineStore, query: PrimaryFunnelBaselineQuery): PrimaryFunnelBaseline[] {
  return query.apply(store.list());
}
