import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionCycle } from "./redemption-cycle.js";

/** Keeps redemption cycles by code. */
export interface RedemptionCycleStore {
  find(code: string): RedemptionCycle | undefined;
  save(item: RedemptionCycle): void;
  remove(code: string): boolean;
  list(): RedemptionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionCycleStore implements RedemptionCycleStore {
  items: Map<string, RedemptionCycle>;
  order: string[];

  constructor(items: Map<string, RedemptionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionCycle): void {
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

  list(): RedemptionCycle[] {
    const out: RedemptionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionCycleStore(): RedemptionCycleStore {
  return new MemoryRedemptionCycleStore(new Map<string, RedemptionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionCycleStore implements RedemptionCycleStore {
  inner: RedemptionCycleStore;
  cache: cache.TtlCache<RedemptionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionCycleStore,
    cacheValue: cache.TtlCache<RedemptionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionCycle | undefined {
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

  save(item: RedemptionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionCycle[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionCycleStore(inner: RedemptionCycleStore, ttl: number, clockValue: clock.Clock): RedemptionCycleStore {
  return new CachedRedemptionCycleStore(inner, cache.newTtlCache<RedemptionCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption cycles. Empty fields match all. */
export class RedemptionCycleQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionCycle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionCycle[]): RedemptionCycle[] {
    const matched = collections.filter(items, (candidate: RedemptionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionCycles(store: RedemptionCycleStore, query: RedemptionCycleQuery): RedemptionCycle[] {
  return query.apply(store.list());
}
