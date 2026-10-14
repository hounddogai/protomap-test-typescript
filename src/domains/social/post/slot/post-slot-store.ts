import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostSlot } from "./post-slot.js";

/** Keeps post slots by code. */
export interface PostSlotStore {
  find(code: string): PostSlot | undefined;
  save(item: PostSlot): void;
  remove(code: string): boolean;
  list(): PostSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostSlotStore implements PostSlotStore {
  items: Map<string, PostSlot>;
  order: string[];

  constructor(items: Map<string, PostSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostSlot): void {
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

  list(): PostSlot[] {
    const out: PostSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostSlotStore(): PostSlotStore {
  return new MemoryPostSlotStore(new Map<string, PostSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostSlotStore implements PostSlotStore {
  inner: PostSlotStore;
  cache: cache.TtlCache<PostSlot>;
  hits: number;
  misses: number;

  constructor(inner: PostSlotStore, cacheValue: cache.TtlCache<PostSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostSlot | undefined {
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

  save(item: PostSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostSlot[] {
    return this.inner.list();
  }
}

export function newCachedPostSlotStore(inner: PostSlotStore, ttl: number, clockValue: clock.Clock): PostSlotStore {
  return new CachedPostSlotStore(inner, cache.newTtlCache<PostSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects post slots. Empty fields match all. */
export class PostSlotQuery {
  region: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostSlot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostSlot[]): PostSlot[] {
    const matched = collections.filter(items, (candidate: PostSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostSlots(store: PostSlotStore, query: PostSlotQuery): PostSlot[] {
  return query.apply(store.list());
}
