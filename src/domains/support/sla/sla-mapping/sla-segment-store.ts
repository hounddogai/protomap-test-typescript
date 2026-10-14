import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaSegment } from "./sla-segment.js";

/** Keeps sla segments by code. */
export interface SlaSegmentStore {
  find(code: string): SlaSegment | undefined;
  save(item: SlaSegment): void;
  remove(code: string): boolean;
  list(): SlaSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaSegmentStore implements SlaSegmentStore {
  items: Map<string, SlaSegment>;
  order: string[];

  constructor(items: Map<string, SlaSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaSegment): void {
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

  list(): SlaSegment[] {
    const out: SlaSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaSegmentStore(): SlaSegmentStore {
  return new MemorySlaSegmentStore(new Map<string, SlaSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaSegmentStore implements SlaSegmentStore {
  inner: SlaSegmentStore;
  cache: cache.TtlCache<SlaSegment>;
  hits: number;
  misses: number;

  constructor(inner: SlaSegmentStore, cacheValue: cache.TtlCache<SlaSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaSegment | undefined {
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

  save(item: SlaSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaSegment[] {
    return this.inner.list();
  }
}

export function newCachedSlaSegmentStore(inner: SlaSegmentStore, ttl: number, clockValue: clock.Clock): SlaSegmentStore {
  return new CachedSlaSegmentStore(inner, cache.newTtlCache<SlaSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects sla segments. Empty fields match all. */
export class SlaSegmentQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaSegment[]): SlaSegment[] {
    const matched = collections.filter(items, (candidate: SlaSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaSegments(store: SlaSegmentStore, query: SlaSegmentQuery): SlaSegment[] {
  return query.apply(store.list());
}
