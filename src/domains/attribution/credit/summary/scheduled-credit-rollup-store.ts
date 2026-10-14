import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCreditRollup } from "./scheduled-credit-rollup.js";

/** Keeps scheduled credit rollups by code. */
export interface ScheduledCreditRollupStore {
  find(code: string): ScheduledCreditRollup | undefined;
  save(item: ScheduledCreditRollup): void;
  remove(code: string): boolean;
  list(): ScheduledCreditRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCreditRollupStore implements ScheduledCreditRollupStore {
  items: Map<string, ScheduledCreditRollup>;
  order: string[];

  constructor(items: Map<string, ScheduledCreditRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCreditRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCreditRollup): void {
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

  list(): ScheduledCreditRollup[] {
    const out: ScheduledCreditRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCreditRollupStore(): ScheduledCreditRollupStore {
  return new MemoryScheduledCreditRollupStore(new Map<string, ScheduledCreditRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCreditRollupStore implements ScheduledCreditRollupStore {
  inner: ScheduledCreditRollupStore;
  cache: cache.TtlCache<ScheduledCreditRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCreditRollupStore,
    cacheValue: cache.TtlCache<ScheduledCreditRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCreditRollup | undefined {
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

  save(item: ScheduledCreditRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCreditRollup[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCreditRollupStore(inner: ScheduledCreditRollupStore, ttl: number, clockValue: clock.Clock): ScheduledCreditRollupStore {
  return new CachedScheduledCreditRollupStore(
    inner,
    cache.newTtlCache<ScheduledCreditRollup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled credit rollups. Empty fields match all. */
export class ScheduledCreditRollupQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCreditRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCreditRollup[]): ScheduledCreditRollup[] {
    const matched = collections.filter(items, (candidate: ScheduledCreditRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCreditRollups(store: ScheduledCreditRollupStore, query: ScheduledCreditRollupQuery): ScheduledCreditRollup[] {
  return query.apply(store.list());
}
