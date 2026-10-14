import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencySegment } from "./frequency-segment.js";

/** Keeps frequency segments by code. */
export interface FrequencySegmentStore {
  find(code: string): FrequencySegment | undefined;
  save(item: FrequencySegment): void;
  remove(code: string): boolean;
  list(): FrequencySegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencySegmentStore implements FrequencySegmentStore {
  items: Map<string, FrequencySegment>;
  order: string[];

  constructor(items: Map<string, FrequencySegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencySegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencySegment): void {
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

  list(): FrequencySegment[] {
    const out: FrequencySegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencySegmentStore(): FrequencySegmentStore {
  return new MemoryFrequencySegmentStore(new Map<string, FrequencySegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencySegmentStore implements FrequencySegmentStore {
  inner: FrequencySegmentStore;
  cache: cache.TtlCache<FrequencySegment>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencySegmentStore,
    cacheValue: cache.TtlCache<FrequencySegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencySegment | undefined {
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

  save(item: FrequencySegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencySegment[] {
    return this.inner.list();
  }
}

export function newCachedFrequencySegmentStore(inner: FrequencySegmentStore, ttl: number, clockValue: clock.Clock): FrequencySegmentStore {
  return new CachedFrequencySegmentStore(inner, cache.newTtlCache<FrequencySegment>(128, ttl, clockValue), 0, 0);
}

/** Selects frequency segments. Empty fields match all. */
export class FrequencySegmentQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencySegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencySegment[]): FrequencySegment[] {
    const matched = collections.filter(items, (candidate: FrequencySegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencySegments(store: FrequencySegmentStore, query: FrequencySegmentQuery): FrequencySegment[] {
  return query.apply(store.list());
}
