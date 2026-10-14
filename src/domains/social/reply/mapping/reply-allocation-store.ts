import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyAllocation } from "./reply-allocation.js";

/** Keeps reply allocations by code. */
export interface ReplyAllocationStore {
  find(code: string): ReplyAllocation | undefined;
  save(item: ReplyAllocation): void;
  remove(code: string): boolean;
  list(): ReplyAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyAllocationStore implements ReplyAllocationStore {
  items: Map<string, ReplyAllocation>;
  order: string[];

  constructor(items: Map<string, ReplyAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyAllocation): void {
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

  list(): ReplyAllocation[] {
    const out: ReplyAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyAllocationStore(): ReplyAllocationStore {
  return new MemoryReplyAllocationStore(new Map<string, ReplyAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyAllocationStore implements ReplyAllocationStore {
  inner: ReplyAllocationStore;
  cache: cache.TtlCache<ReplyAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ReplyAllocationStore,
    cacheValue: cache.TtlCache<ReplyAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyAllocation | undefined {
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

  save(item: ReplyAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyAllocation[] {
    return this.inner.list();
  }
}

export function newCachedReplyAllocationStore(inner: ReplyAllocationStore, ttl: number, clockValue: clock.Clock): ReplyAllocationStore {
  return new CachedReplyAllocationStore(inner, cache.newTtlCache<ReplyAllocation>(256, ttl, clockValue), 0, 0);
}

/** Selects reply allocations. Empty fields match all. */
export class ReplyAllocationQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyAllocation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyAllocation[]): ReplyAllocation[] {
    const matched = collections.filter(items, (candidate: ReplyAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyAllocations(store: ReplyAllocationStore, query: ReplyAllocationQuery): ReplyAllocation[] {
  return query.apply(store.list());
}
