import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostPreference } from "./post-preference.js";

/** Keeps post preferences by code. */
export interface PostPreferenceStore {
  find(code: string): PostPreference | undefined;
  save(item: PostPreference): void;
  remove(code: string): boolean;
  list(): PostPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostPreferenceStore implements PostPreferenceStore {
  items: Map<string, PostPreference>;
  order: string[];

  constructor(items: Map<string, PostPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostPreference): void {
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

  list(): PostPreference[] {
    const out: PostPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostPreferenceStore(): PostPreferenceStore {
  return new MemoryPostPreferenceStore(new Map<string, PostPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostPreferenceStore implements PostPreferenceStore {
  inner: PostPreferenceStore;
  cache: cache.TtlCache<PostPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PostPreferenceStore,
    cacheValue: cache.TtlCache<PostPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostPreference | undefined {
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

  save(item: PostPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostPreference[] {
    return this.inner.list();
  }
}

export function newCachedPostPreferenceStore(inner: PostPreferenceStore, ttl: number, clockValue: clock.Clock): PostPreferenceStore {
  return new CachedPostPreferenceStore(inner, cache.newTtlCache<PostPreference>(512, ttl, clockValue), 0, 0);
}

/** Selects post preferences. Empty fields match all. */
export class PostPreferenceQuery {
  category: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMinimum: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostPreference): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostPreference[]): PostPreference[] {
    const matched = collections.filter(items, (candidate: PostPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostPreferences(store: PostPreferenceStore, query: PostPreferenceQuery): PostPreference[] {
  return query.apply(store.list());
}
