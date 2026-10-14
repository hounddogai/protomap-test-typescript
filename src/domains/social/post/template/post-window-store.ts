import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostWindow } from "./post-window.js";

/** Keeps post windows by code. */
export interface PostWindowStore {
  find(code: string): PostWindow | undefined;
  save(item: PostWindow): void;
  remove(code: string): boolean;
  list(): PostWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostWindowStore implements PostWindowStore {
  items: Map<string, PostWindow>;
  order: string[];

  constructor(items: Map<string, PostWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostWindow): void {
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

  list(): PostWindow[] {
    const out: PostWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostWindowStore(): PostWindowStore {
  return new MemoryPostWindowStore(new Map<string, PostWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostWindowStore implements PostWindowStore {
  inner: PostWindowStore;
  cache: cache.TtlCache<PostWindow>;
  hits: number;
  misses: number;

  constructor(inner: PostWindowStore, cacheValue: cache.TtlCache<PostWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostWindow | undefined {
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

  save(item: PostWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostWindow[] {
    return this.inner.list();
  }
}

export function newCachedPostWindowStore(inner: PostWindowStore, ttl: number, clockValue: clock.Clock): PostWindowStore {
  return new CachedPostWindowStore(inner, cache.newTtlCache<PostWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects post windows. Empty fields match all. */
export class PostWindowQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostWindow): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostWindow[]): PostWindow[] {
    const matched = collections.filter(items, (candidate: PostWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostWindows(store: PostWindowStore, query: PostWindowQuery): PostWindow[] {
  return query.apply(store.list());
}
