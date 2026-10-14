import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFrequencyCycle } from "./pending-frequency-cycle.js";

/** Keeps pending frequency cycles by code. */
export interface PendingFrequencyCycleStore {
  find(code: string): PendingFrequencyCycle | undefined;
  save(item: PendingFrequencyCycle): void;
  remove(code: string): boolean;
  list(): PendingFrequencyCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFrequencyCycleStore implements PendingFrequencyCycleStore {
  items: Map<string, PendingFrequencyCycle>;
  order: string[];

  constructor(items: Map<string, PendingFrequencyCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFrequencyCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFrequencyCycle): void {
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

  list(): PendingFrequencyCycle[] {
    const out: PendingFrequencyCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFrequencyCycleStore(): PendingFrequencyCycleStore {
  return new MemoryPendingFrequencyCycleStore(new Map<string, PendingFrequencyCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFrequencyCycleStore implements PendingFrequencyCycleStore {
  inner: PendingFrequencyCycleStore;
  cache: cache.TtlCache<PendingFrequencyCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFrequencyCycleStore,
    cacheValue: cache.TtlCache<PendingFrequencyCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFrequencyCycle | undefined {
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

  save(item: PendingFrequencyCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFrequencyCycle[] {
    return this.inner.list();
  }
}

export function newCachedPendingFrequencyCycleStore(inner: PendingFrequencyCycleStore, ttl: number, clockValue: clock.Clock): PendingFrequencyCycleStore {
  return new CachedPendingFrequencyCycleStore(
    inner,
    cache.newTtlCache<PendingFrequencyCycle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending frequency cycles. Empty fields match all. */
export class PendingFrequencyCycleQuery {
  country: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFrequencyCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFrequencyCycle[]): PendingFrequencyCycle[] {
    const matched = collections.filter(items, (candidate: PendingFrequencyCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFrequencyCycles(store: PendingFrequencyCycleStore, query: PendingFrequencyCycleQuery): PendingFrequencyCycle[] {
  return query.apply(store.list());
}
