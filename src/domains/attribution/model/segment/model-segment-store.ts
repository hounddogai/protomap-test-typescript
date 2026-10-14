import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelSegment } from "./model-segment.js";

/** Keeps model segments by code. */
export interface ModelSegmentStore {
  find(code: string): ModelSegment | undefined;
  save(item: ModelSegment): void;
  remove(code: string): boolean;
  list(): ModelSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelSegmentStore implements ModelSegmentStore {
  items: Map<string, ModelSegment>;
  order: string[];

  constructor(items: Map<string, ModelSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelSegment): void {
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

  list(): ModelSegment[] {
    const out: ModelSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelSegmentStore(): ModelSegmentStore {
  return new MemoryModelSegmentStore(new Map<string, ModelSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelSegmentStore implements ModelSegmentStore {
  inner: ModelSegmentStore;
  cache: cache.TtlCache<ModelSegment>;
  hits: number;
  misses: number;

  constructor(inner: ModelSegmentStore, cacheValue: cache.TtlCache<ModelSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelSegment | undefined {
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

  save(item: ModelSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelSegment[] {
    return this.inner.list();
  }
}

export function newCachedModelSegmentStore(inner: ModelSegmentStore, ttl: number, clockValue: clock.Clock): ModelSegmentStore {
  return new CachedModelSegmentStore(inner, cache.newTtlCache<ModelSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects model segments. Empty fields match all. */
export class ModelSegmentQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelSegment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelSegment[]): ModelSegment[] {
    const matched = collections.filter(items, (candidate: ModelSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelSegments(store: ModelSegmentStore, query: ModelSegmentQuery): ModelSegment[] {
  return query.apply(store.list());
}
