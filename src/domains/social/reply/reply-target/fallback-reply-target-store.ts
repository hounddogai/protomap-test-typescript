import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackReplyTarget } from "./fallback-reply-target.js";

/** Keeps fallback reply targets by code. */
export interface FallbackReplyTargetStore {
  find(code: string): FallbackReplyTarget | undefined;
  save(item: FallbackReplyTarget): void;
  remove(code: string): boolean;
  list(): FallbackReplyTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackReplyTargetStore implements FallbackReplyTargetStore {
  items: Map<string, FallbackReplyTarget>;
  order: string[];

  constructor(items: Map<string, FallbackReplyTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackReplyTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackReplyTarget): void {
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

  list(): FallbackReplyTarget[] {
    const out: FallbackReplyTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackReplyTargetStore(): FallbackReplyTargetStore {
  return new MemoryFallbackReplyTargetStore(new Map<string, FallbackReplyTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackReplyTargetStore implements FallbackReplyTargetStore {
  inner: FallbackReplyTargetStore;
  cache: cache.TtlCache<FallbackReplyTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackReplyTargetStore,
    cacheValue: cache.TtlCache<FallbackReplyTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackReplyTarget | undefined {
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

  save(item: FallbackReplyTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackReplyTarget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackReplyTargetStore(inner: FallbackReplyTargetStore, ttl: number, clockValue: clock.Clock): FallbackReplyTargetStore {
  return new CachedFallbackReplyTargetStore(inner, cache.newTtlCache<FallbackReplyTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects fallback reply targets. Empty fields match all. */
export class FallbackReplyTargetQuery {
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

  matches(item: FallbackReplyTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackReplyTarget[]): FallbackReplyTarget[] {
    const matched = collections.filter(items, (candidate: FallbackReplyTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackReplyTargets(store: FallbackReplyTargetStore, query: FallbackReplyTargetQuery): FallbackReplyTarget[] {
  return query.apply(store.list());
}
