import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostTarget } from "./post-target.js";

/** Keeps post targets by code. */
export interface PostTargetStore {
  find(code: string): PostTarget | undefined;
  save(item: PostTarget): void;
  remove(code: string): boolean;
  list(): PostTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostTargetStore implements PostTargetStore {
  items: Map<string, PostTarget>;
  order: string[];

  constructor(items: Map<string, PostTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostTarget): void {
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

  list(): PostTarget[] {
    const out: PostTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostTargetStore(): PostTargetStore {
  return new MemoryPostTargetStore(new Map<string, PostTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostTargetStore implements PostTargetStore {
  inner: PostTargetStore;
  cache: cache.TtlCache<PostTarget>;
  hits: number;
  misses: number;

  constructor(inner: PostTargetStore, cacheValue: cache.TtlCache<PostTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostTarget | undefined {
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

  save(item: PostTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostTarget[] {
    return this.inner.list();
  }
}

export function newCachedPostTargetStore(inner: PostTargetStore, ttl: number, clockValue: clock.Clock): PostTargetStore {
  return new CachedPostTargetStore(inner, cache.newTtlCache<PostTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects post targets. Empty fields match all. */
export class PostTargetQuery {
  source: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minClicks: number, statuses: string[], limit: number) {
    this.source = source;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostTarget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostTarget[]): PostTarget[] {
    const matched = collections.filter(items, (candidate: PostTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostTargets(store: PostTargetStore, query: PostTargetQuery): PostTarget[] {
  return query.apply(store.list());
}
