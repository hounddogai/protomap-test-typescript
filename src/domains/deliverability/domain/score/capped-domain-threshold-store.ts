import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDomainThreshold } from "./capped-domain-threshold.js";

/** Keeps capped domain thresholds by code. */
export interface CappedDomainThresholdStore {
  find(code: string): CappedDomainThreshold | undefined;
  save(item: CappedDomainThreshold): void;
  remove(code: string): boolean;
  list(): CappedDomainThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDomainThresholdStore implements CappedDomainThresholdStore {
  items: Map<string, CappedDomainThreshold>;
  order: string[];

  constructor(items: Map<string, CappedDomainThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDomainThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDomainThreshold): void {
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

  list(): CappedDomainThreshold[] {
    const out: CappedDomainThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDomainThresholdStore(): CappedDomainThresholdStore {
  return new MemoryCappedDomainThresholdStore(new Map<string, CappedDomainThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDomainThresholdStore implements CappedDomainThresholdStore {
  inner: CappedDomainThresholdStore;
  cache: cache.TtlCache<CappedDomainThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDomainThresholdStore,
    cacheValue: cache.TtlCache<CappedDomainThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDomainThreshold | undefined {
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

  save(item: CappedDomainThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDomainThreshold[] {
    return this.inner.list();
  }
}

export function newCachedCappedDomainThresholdStore(inner: CappedDomainThresholdStore, ttl: number, clockValue: clock.Clock): CappedDomainThresholdStore {
  return new CachedCappedDomainThresholdStore(
    inner,
    cache.newTtlCache<CappedDomainThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped domain thresholds. Empty fields match all. */
export class CappedDomainThresholdQuery {
  category: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minClicks: number, statuses: string[], limit: number) {
    this.category = category;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDomainThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDomainThreshold[]): CappedDomainThreshold[] {
    const matched = collections.filter(items, (candidate: CappedDomainThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDomainThresholds(store: CappedDomainThresholdStore, query: CappedDomainThresholdQuery): CappedDomainThreshold[] {
  return query.apply(store.list());
}
