import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostCycle } from "./post-cycle.js";

/** Keeps post cycles by code. */
export interface PostCycleStore {
  find(code: string): PostCycle | undefined;
  save(item: PostCycle): void;
  remove(code: string): boolean;
  list(): PostCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostCycleStore implements PostCycleStore {
  items: Map<string, PostCycle>;
  order: string[];

  constructor(items: Map<string, PostCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostCycle): void {
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

  list(): PostCycle[] {
    const out: PostCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostCycleStore(): PostCycleStore {
  return new MemoryPostCycleStore(new Map<string, PostCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostCycleStore implements PostCycleStore {
  inner: PostCycleStore;
  cache: cache.TtlCache<PostCycle>;
  hits: number;
  misses: number;

  constructor(inner: PostCycleStore, cacheValue: cache.TtlCache<PostCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostCycle | undefined {
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

  save(item: PostCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostCycle[] {
    return this.inner.list();
  }
}

export function newCachedPostCycleStore(inner: PostCycleStore, ttl: number, clockValue: clock.Clock): PostCycleStore {
  return new CachedPostCycleStore(inner, cache.newTtlCache<PostCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects post cycles. Empty fields match all. */
export class PostCycleQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostCycle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostCycle[]): PostCycle[] {
    const matched = collections.filter(items, (candidate: PostCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostCycles(store: PostCycleStore, query: PostCycleQuery): PostCycle[] {
  return query.apply(store.list());
}
