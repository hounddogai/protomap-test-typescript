import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalDomainRollup } from "./regional-domain-rollup.js";

/** Keeps regional domain rollups by code. */
export interface RegionalDomainRollupStore {
  find(code: string): RegionalDomainRollup | undefined;
  save(item: RegionalDomainRollup): void;
  remove(code: string): boolean;
  list(): RegionalDomainRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalDomainRollupStore implements RegionalDomainRollupStore {
  items: Map<string, RegionalDomainRollup>;
  order: string[];

  constructor(items: Map<string, RegionalDomainRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalDomainRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalDomainRollup): void {
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

  list(): RegionalDomainRollup[] {
    const out: RegionalDomainRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalDomainRollupStore(): RegionalDomainRollupStore {
  return new MemoryRegionalDomainRollupStore(new Map<string, RegionalDomainRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalDomainRollupStore implements RegionalDomainRollupStore {
  inner: RegionalDomainRollupStore;
  cache: cache.TtlCache<RegionalDomainRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalDomainRollupStore,
    cacheValue: cache.TtlCache<RegionalDomainRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalDomainRollup | undefined {
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

  save(item: RegionalDomainRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalDomainRollup[] {
    return this.inner.list();
  }
}

export function newCachedRegionalDomainRollupStore(inner: RegionalDomainRollupStore, ttl: number, clockValue: clock.Clock): RegionalDomainRollupStore {
  return new CachedRegionalDomainRollupStore(
    inner,
    cache.newTtlCache<RegionalDomainRollup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional domain rollups. Empty fields match all. */
export class RegionalDomainRollupQuery {
  utmSource: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWeight: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalDomainRollup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalDomainRollup[]): RegionalDomainRollup[] {
    const matched = collections.filter(items, (candidate: RegionalDomainRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalDomainRollups(store: RegionalDomainRollupStore, query: RegionalDomainRollupQuery): RegionalDomainRollup[] {
  return query.apply(store.list());
}
