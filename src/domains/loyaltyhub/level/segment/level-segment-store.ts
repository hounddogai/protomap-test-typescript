import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelSegment } from "./level-segment.js";

/** Keeps level segments by code. */
export interface LevelSegmentStore {
  find(code: string): LevelSegment | undefined;
  save(item: LevelSegment): void;
  remove(code: string): boolean;
  list(): LevelSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelSegmentStore implements LevelSegmentStore {
  items: Map<string, LevelSegment>;
  order: string[];

  constructor(items: Map<string, LevelSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelSegment): void {
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

  list(): LevelSegment[] {
    const out: LevelSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelSegmentStore(): LevelSegmentStore {
  return new MemoryLevelSegmentStore(new Map<string, LevelSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelSegmentStore implements LevelSegmentStore {
  inner: LevelSegmentStore;
  cache: cache.TtlCache<LevelSegment>;
  hits: number;
  misses: number;

  constructor(inner: LevelSegmentStore, cacheValue: cache.TtlCache<LevelSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelSegment | undefined {
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

  save(item: LevelSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelSegment[] {
    return this.inner.list();
  }
}

export function newCachedLevelSegmentStore(inner: LevelSegmentStore, ttl: number, clockValue: clock.Clock): LevelSegmentStore {
  return new CachedLevelSegmentStore(inner, cache.newTtlCache<LevelSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects level segments. Empty fields match all. */
export class LevelSegmentQuery {
  category: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelSegment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelSegment[]): LevelSegment[] {
    const matched = collections.filter(items, (candidate: LevelSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelSegments(store: LevelSegmentStore, query: LevelSegmentQuery): LevelSegment[] {
  return query.apply(store.list());
}
