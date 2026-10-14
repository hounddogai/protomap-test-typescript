import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingSegment } from "./pacing-segment.js";

/** Keeps pacing segments by code. */
export interface PacingSegmentStore {
  find(code: string): PacingSegment | undefined;
  save(item: PacingSegment): void;
  remove(code: string): boolean;
  list(): PacingSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingSegmentStore implements PacingSegmentStore {
  items: Map<string, PacingSegment>;
  order: string[];

  constructor(items: Map<string, PacingSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingSegment): void {
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

  list(): PacingSegment[] {
    const out: PacingSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingSegmentStore(): PacingSegmentStore {
  return new MemoryPacingSegmentStore(new Map<string, PacingSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingSegmentStore implements PacingSegmentStore {
  inner: PacingSegmentStore;
  cache: cache.TtlCache<PacingSegment>;
  hits: number;
  misses: number;

  constructor(inner: PacingSegmentStore, cacheValue: cache.TtlCache<PacingSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingSegment | undefined {
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

  save(item: PacingSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingSegment[] {
    return this.inner.list();
  }
}

export function newCachedPacingSegmentStore(inner: PacingSegmentStore, ttl: number, clockValue: clock.Clock): PacingSegmentStore {
  return new CachedPacingSegmentStore(inner, cache.newTtlCache<PacingSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing segments. Empty fields match all. */
export class PacingSegmentQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingSegment[]): PacingSegment[] {
    const matched = collections.filter(items, (candidate: PacingSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingSegments(store: PacingSegmentStore, query: PacingSegmentQuery): PacingSegment[] {
  return query.apply(store.list());
}
