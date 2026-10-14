import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionSlot } from "./redemption-slot.js";

/** Keeps redemption slots by code. */
export interface RedemptionSlotStore {
  find(code: string): RedemptionSlot | undefined;
  save(item: RedemptionSlot): void;
  remove(code: string): boolean;
  list(): RedemptionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionSlotStore implements RedemptionSlotStore {
  items: Map<string, RedemptionSlot>;
  order: string[];

  constructor(items: Map<string, RedemptionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionSlot): void {
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

  list(): RedemptionSlot[] {
    const out: RedemptionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionSlotStore(): RedemptionSlotStore {
  return new MemoryRedemptionSlotStore(new Map<string, RedemptionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionSlotStore implements RedemptionSlotStore {
  inner: RedemptionSlotStore;
  cache: cache.TtlCache<RedemptionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionSlotStore,
    cacheValue: cache.TtlCache<RedemptionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionSlot | undefined {
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

  save(item: RedemptionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionSlot[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionSlotStore(inner: RedemptionSlotStore, ttl: number, clockValue: clock.Clock): RedemptionSlotStore {
  return new CachedRedemptionSlotStore(inner, cache.newTtlCache<RedemptionSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects redemption slots. Empty fields match all. */
export class RedemptionSlotQuery {
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

  matches(item: RedemptionSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionSlot[]): RedemptionSlot[] {
    const matched = collections.filter(items, (candidate: RedemptionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionSlots(store: RedemptionSlotStore, query: RedemptionSlotQuery): RedemptionSlot[] {
  return query.apply(store.list());
}
