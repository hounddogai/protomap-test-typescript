import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainBaseline } from "./domain-baseline.js";

/** Keeps domain baselines by code. */
export interface DomainBaselineStore {
  find(code: string): DomainBaseline | undefined;
  save(item: DomainBaseline): void;
  remove(code: string): boolean;
  list(): DomainBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainBaselineStore implements DomainBaselineStore {
  items: Map<string, DomainBaseline>;
  order: string[];

  constructor(items: Map<string, DomainBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainBaseline): void {
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

  list(): DomainBaseline[] {
    const out: DomainBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainBaselineStore(): DomainBaselineStore {
  return new MemoryDomainBaselineStore(new Map<string, DomainBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainBaselineStore implements DomainBaselineStore {
  inner: DomainBaselineStore;
  cache: cache.TtlCache<DomainBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: DomainBaselineStore,
    cacheValue: cache.TtlCache<DomainBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainBaseline | undefined {
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

  save(item: DomainBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainBaseline[] {
    return this.inner.list();
  }
}

export function newCachedDomainBaselineStore(inner: DomainBaselineStore, ttl: number, clockValue: clock.Clock): DomainBaselineStore {
  return new CachedDomainBaselineStore(inner, cache.newTtlCache<DomainBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects domain baselines. Empty fields match all. */
export class DomainBaselineQuery {
  country: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minGraceDays: number, statuses: string[], limit: number) {
    this.country = country;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainBaseline): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainBaseline[]): DomainBaseline[] {
    const matched = collections.filter(items, (candidate: DomainBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainBaselines(store: DomainBaselineStore, query: DomainBaselineQuery): DomainBaseline[] {
  return query.apply(store.list());
}
