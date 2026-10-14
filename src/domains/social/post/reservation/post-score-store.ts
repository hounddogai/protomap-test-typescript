import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostScore } from "./post-score.js";

/** Keeps post scores by code. */
export interface PostScoreStore {
  find(code: string): PostScore | undefined;
  save(item: PostScore): void;
  remove(code: string): boolean;
  list(): PostScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostScoreStore implements PostScoreStore {
  items: Map<string, PostScore>;
  order: string[];

  constructor(items: Map<string, PostScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostScore): void {
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

  list(): PostScore[] {
    const out: PostScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostScoreStore(): PostScoreStore {
  return new MemoryPostScoreStore(new Map<string, PostScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostScoreStore implements PostScoreStore {
  inner: PostScoreStore;
  cache: cache.TtlCache<PostScore>;
  hits: number;
  misses: number;

  constructor(inner: PostScoreStore, cacheValue: cache.TtlCache<PostScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostScore | undefined {
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

  save(item: PostScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostScore[] {
    return this.inner.list();
  }
}

export function newCachedPostScoreStore(inner: PostScoreStore, ttl: number, clockValue: clock.Clock): PostScoreStore {
  return new CachedPostScoreStore(inner, cache.newTtlCache<PostScore>(64, ttl, clockValue), 0, 0);
}

/** Selects post scores. Empty fields match all. */
export class PostScoreQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostScore[]): PostScore[] {
    const matched = collections.filter(items, (candidate: PostScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostScores(store: PostScoreStore, query: PostScoreQuery): PostScore[] {
  return query.apply(store.list());
}
