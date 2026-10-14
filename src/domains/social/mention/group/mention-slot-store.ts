import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionSlot } from "./mention-slot.js";

/** Keeps mention slots by code. */
export interface MentionSlotStore {
  find(code: string): MentionSlot | undefined;
  save(item: MentionSlot): void;
  remove(code: string): boolean;
  list(): MentionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionSlotStore implements MentionSlotStore {
  items: Map<string, MentionSlot>;
  order: string[];

  constructor(items: Map<string, MentionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionSlot): void {
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

  list(): MentionSlot[] {
    const out: MentionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionSlotStore(): MentionSlotStore {
  return new MemoryMentionSlotStore(new Map<string, MentionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionSlotStore implements MentionSlotStore {
  inner: MentionSlotStore;
  cache: cache.TtlCache<MentionSlot>;
  hits: number;
  misses: number;

  constructor(inner: MentionSlotStore, cacheValue: cache.TtlCache<MentionSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionSlot | undefined {
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

  save(item: MentionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionSlot[] {
    return this.inner.list();
  }
}

export function newCachedMentionSlotStore(inner: MentionSlotStore, ttl: number, clockValue: clock.Clock): MentionSlotStore {
  return new CachedMentionSlotStore(inner, cache.newTtlCache<MentionSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects mention slots. Empty fields match all. */
export class MentionSlotQuery {
  unit: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCapacity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionSlot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionSlot[]): MentionSlot[] {
    const matched = collections.filter(items, (candidate: MentionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionSlots(store: MentionSlotStore, query: MentionSlotQuery): MentionSlot[] {
  return query.apply(store.list());
}
