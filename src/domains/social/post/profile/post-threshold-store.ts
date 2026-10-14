import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostThreshold } from "./post-threshold.js";

/** Keeps post thresholds by code. */
export interface PostThresholdStore {
  find(code: string): PostThreshold | undefined;
  save(item: PostThreshold): void;
  remove(code: string): boolean;
  list(): PostThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostThresholdStore implements PostThresholdStore {
  items: Map<string, PostThreshold>;
  order: string[];

  constructor(items: Map<string, PostThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostThreshold): void {
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

  list(): PostThreshold[] {
    const out: PostThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostThresholdStore(): PostThresholdStore {
  return new MemoryPostThresholdStore(new Map<string, PostThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostThresholdStore implements PostThresholdStore {
  inner: PostThresholdStore;
  cache: cache.TtlCache<PostThreshold>;
  hits: number;
  misses: number;

  constructor(inner: PostThresholdStore, cacheValue: cache.TtlCache<PostThreshold>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostThreshold | undefined {
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

  save(item: PostThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostThreshold[] {
    return this.inner.list();
  }
}

export function newCachedPostThresholdStore(inner: PostThresholdStore, ttl: number, clockValue: clock.Clock): PostThresholdStore {
  return new CachedPostThresholdStore(inner, cache.newTtlCache<PostThreshold>(1024, ttl, clockValue), 0, 0);
}

/** Selects post thresholds. Empty fields match all. */
export class PostThresholdQuery {
  unit: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minSequence: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostThreshold): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostThreshold[]): PostThreshold[] {
    const matched = collections.filter(items, (candidate: PostThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostThresholds(store: PostThresholdStore, query: PostThresholdQuery): PostThreshold[] {
  return query.apply(store.list());
}
