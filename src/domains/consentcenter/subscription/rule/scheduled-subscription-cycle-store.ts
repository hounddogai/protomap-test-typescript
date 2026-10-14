import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSubscriptionCycle } from "./scheduled-subscription-cycle.js";

/** Keeps scheduled subscription cycles by code. */
export interface ScheduledSubscriptionCycleStore {
  find(code: string): ScheduledSubscriptionCycle | undefined;
  save(item: ScheduledSubscriptionCycle): void;
  remove(code: string): boolean;
  list(): ScheduledSubscriptionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSubscriptionCycleStore implements ScheduledSubscriptionCycleStore {
  items: Map<string, ScheduledSubscriptionCycle>;
  order: string[];

  constructor(items: Map<string, ScheduledSubscriptionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSubscriptionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSubscriptionCycle): void {
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

  list(): ScheduledSubscriptionCycle[] {
    const out: ScheduledSubscriptionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSubscriptionCycleStore(): ScheduledSubscriptionCycleStore {
  return new MemoryScheduledSubscriptionCycleStore(new Map<string, ScheduledSubscriptionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSubscriptionCycleStore implements ScheduledSubscriptionCycleStore {
  inner: ScheduledSubscriptionCycleStore;
  cache: cache.TtlCache<ScheduledSubscriptionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSubscriptionCycleStore,
    cacheValue: cache.TtlCache<ScheduledSubscriptionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSubscriptionCycle | undefined {
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

  save(item: ScheduledSubscriptionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSubscriptionCycle[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSubscriptionCycleStore(inner: ScheduledSubscriptionCycleStore, ttl: number, clockValue: clock.Clock): ScheduledSubscriptionCycleStore {
  return new CachedScheduledSubscriptionCycleStore(
    inner,
    cache.newTtlCache<ScheduledSubscriptionCycle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled subscription cycles. Empty fields match all. */
export class ScheduledSubscriptionCycleQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSubscriptionCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSubscriptionCycle[]): ScheduledSubscriptionCycle[] {
    const matched = collections.filter(items, (candidate: ScheduledSubscriptionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSubscriptionCycles(store: ScheduledSubscriptionCycleStore, query: ScheduledSubscriptionCycleQuery): ScheduledSubscriptionCycle[] {
  return query.apply(store.list());
}
