import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplySlot } from "./reply-slot.js";

/** Keeps reply slots by code. */
export interface ReplySlotStore {
  find(code: string): ReplySlot | undefined;
  save(item: ReplySlot): void;
  remove(code: string): boolean;
  list(): ReplySlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplySlotStore implements ReplySlotStore {
  items: Map<string, ReplySlot>;
  order: string[];

  constructor(items: Map<string, ReplySlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplySlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplySlot): void {
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

  list(): ReplySlot[] {
    const out: ReplySlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplySlotStore(): ReplySlotStore {
  return new MemoryReplySlotStore(new Map<string, ReplySlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplySlotStore implements ReplySlotStore {
  inner: ReplySlotStore;
  cache: cache.TtlCache<ReplySlot>;
  hits: number;
  misses: number;

  constructor(inner: ReplySlotStore, cacheValue: cache.TtlCache<ReplySlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplySlot | undefined {
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

  save(item: ReplySlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplySlot[] {
    return this.inner.list();
  }
}

export function newCachedReplySlotStore(inner: ReplySlotStore, ttl: number, clockValue: clock.Clock): ReplySlotStore {
  return new CachedReplySlotStore(inner, cache.newTtlCache<ReplySlot>(64, ttl, clockValue), 0, 0);
}

/** Selects reply slots. Empty fields match all. */
export class ReplySlotQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplySlot): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplySlot[]): ReplySlot[] {
    const matched = collections.filter(items, (candidate: ReplySlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplySlots(store: ReplySlotStore, query: ReplySlotQuery): ReplySlot[] {
  return query.apply(store.list());
}
