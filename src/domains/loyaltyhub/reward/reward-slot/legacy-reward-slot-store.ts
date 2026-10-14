import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyRewardSlot } from "./legacy-reward-slot.js";

/** Keeps legacy reward slots by code. */
export interface LegacyRewardSlotStore {
  find(code: string): LegacyRewardSlot | undefined;
  save(item: LegacyRewardSlot): void;
  remove(code: string): boolean;
  list(): LegacyRewardSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyRewardSlotStore implements LegacyRewardSlotStore {
  items: Map<string, LegacyRewardSlot>;
  order: string[];

  constructor(items: Map<string, LegacyRewardSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyRewardSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyRewardSlot): void {
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

  list(): LegacyRewardSlot[] {
    const out: LegacyRewardSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyRewardSlotStore(): LegacyRewardSlotStore {
  return new MemoryLegacyRewardSlotStore(new Map<string, LegacyRewardSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyRewardSlotStore implements LegacyRewardSlotStore {
  inner: LegacyRewardSlotStore;
  cache: cache.TtlCache<LegacyRewardSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyRewardSlotStore,
    cacheValue: cache.TtlCache<LegacyRewardSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyRewardSlot | undefined {
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

  save(item: LegacyRewardSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyRewardSlot[] {
    return this.inner.list();
  }
}

export function newCachedLegacyRewardSlotStore(inner: LegacyRewardSlotStore, ttl: number, clockValue: clock.Clock): LegacyRewardSlotStore {
  return new CachedLegacyRewardSlotStore(inner, cache.newTtlCache<LegacyRewardSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects legacy reward slots. Empty fields match all. */
export class LegacyRewardSlotQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyRewardSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyRewardSlot[]): LegacyRewardSlot[] {
    const matched = collections.filter(items, (candidate: LegacyRewardSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyRewardSlots(store: LegacyRewardSlotStore, query: LegacyRewardSlotQuery): LegacyRewardSlot[] {
  return query.apply(store.list());
}
