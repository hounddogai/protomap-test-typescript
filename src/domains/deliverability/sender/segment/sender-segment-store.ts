import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderSegment } from "./sender-segment.js";

/** Keeps sender segments by code. */
export interface SenderSegmentStore {
  find(code: string): SenderSegment | undefined;
  save(item: SenderSegment): void;
  remove(code: string): boolean;
  list(): SenderSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderSegmentStore implements SenderSegmentStore {
  items: Map<string, SenderSegment>;
  order: string[];

  constructor(items: Map<string, SenderSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderSegment): void {
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

  list(): SenderSegment[] {
    const out: SenderSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderSegmentStore(): SenderSegmentStore {
  return new MemorySenderSegmentStore(new Map<string, SenderSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderSegmentStore implements SenderSegmentStore {
  inner: SenderSegmentStore;
  cache: cache.TtlCache<SenderSegment>;
  hits: number;
  misses: number;

  constructor(inner: SenderSegmentStore, cacheValue: cache.TtlCache<SenderSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderSegment | undefined {
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

  save(item: SenderSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderSegment[] {
    return this.inner.list();
  }
}

export function newCachedSenderSegmentStore(inner: SenderSegmentStore, ttl: number, clockValue: clock.Clock): SenderSegmentStore {
  return new CachedSenderSegmentStore(inner, cache.newTtlCache<SenderSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects sender segments. Empty fields match all. */
export class SenderSegmentQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderSegment[]): SenderSegment[] {
    const matched = collections.filter(items, (candidate: SenderSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderSegments(store: SenderSegmentStore, query: SenderSegmentQuery): SenderSegment[] {
  return query.apply(store.list());
}
