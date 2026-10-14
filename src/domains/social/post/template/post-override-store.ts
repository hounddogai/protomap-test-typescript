import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostOverride } from "./post-override.js";

/** Keeps post overrides by code. */
export interface PostOverrideStore {
  find(code: string): PostOverride | undefined;
  save(item: PostOverride): void;
  remove(code: string): boolean;
  list(): PostOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostOverrideStore implements PostOverrideStore {
  items: Map<string, PostOverride>;
  order: string[];

  constructor(items: Map<string, PostOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostOverride): void {
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

  list(): PostOverride[] {
    const out: PostOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostOverrideStore(): PostOverrideStore {
  return new MemoryPostOverrideStore(new Map<string, PostOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostOverrideStore implements PostOverrideStore {
  inner: PostOverrideStore;
  cache: cache.TtlCache<PostOverride>;
  hits: number;
  misses: number;

  constructor(inner: PostOverrideStore, cacheValue: cache.TtlCache<PostOverride>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostOverride | undefined {
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

  save(item: PostOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostOverride[] {
    return this.inner.list();
  }
}

export function newCachedPostOverrideStore(inner: PostOverrideStore, ttl: number, clockValue: clock.Clock): PostOverrideStore {
  return new CachedPostOverrideStore(inner, cache.newTtlCache<PostOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects post overrides. Empty fields match all. */
export class PostOverrideQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostOverride): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostOverride[]): PostOverride[] {
    const matched = collections.filter(items, (candidate: PostOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostOverrides(store: PostOverrideStore, query: PostOverrideQuery): PostOverride[] {
  return query.apply(store.list());
}
