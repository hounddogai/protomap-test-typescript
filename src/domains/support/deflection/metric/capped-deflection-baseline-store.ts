import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDeflectionBaseline } from "./capped-deflection-baseline.js";

/** Keeps capped deflection baselines by code. */
export interface CappedDeflectionBaselineStore {
  find(code: string): CappedDeflectionBaseline | undefined;
  save(item: CappedDeflectionBaseline): void;
  remove(code: string): boolean;
  list(): CappedDeflectionBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDeflectionBaselineStore implements CappedDeflectionBaselineStore {
  items: Map<string, CappedDeflectionBaseline>;
  order: string[];

  constructor(items: Map<string, CappedDeflectionBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDeflectionBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDeflectionBaseline): void {
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

  list(): CappedDeflectionBaseline[] {
    const out: CappedDeflectionBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDeflectionBaselineStore(): CappedDeflectionBaselineStore {
  return new MemoryCappedDeflectionBaselineStore(new Map<string, CappedDeflectionBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDeflectionBaselineStore implements CappedDeflectionBaselineStore {
  inner: CappedDeflectionBaselineStore;
  cache: cache.TtlCache<CappedDeflectionBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDeflectionBaselineStore,
    cacheValue: cache.TtlCache<CappedDeflectionBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDeflectionBaseline | undefined {
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

  save(item: CappedDeflectionBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDeflectionBaseline[] {
    return this.inner.list();
  }
}

export function newCachedCappedDeflectionBaselineStore(inner: CappedDeflectionBaselineStore, ttl: number, clockValue: clock.Clock): CappedDeflectionBaselineStore {
  return new CachedCappedDeflectionBaselineStore(
    inner,
    cache.newTtlCache<CappedDeflectionBaseline>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped deflection baselines. Empty fields match all. */
export class CappedDeflectionBaselineQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDeflectionBaseline): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDeflectionBaseline[]): CappedDeflectionBaseline[] {
    const matched = collections.filter(items, (candidate: CappedDeflectionBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDeflectionBaselines(store: CappedDeflectionBaselineStore, query: CappedDeflectionBaselineQuery): CappedDeflectionBaseline[] {
  return query.apply(store.list());
}
