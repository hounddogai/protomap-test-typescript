import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

/** Keeps legacy double opt in segments by code. */
export interface LegacyDoubleOptInSegmentStore {
  find(code: string): LegacyDoubleOptInSegment | undefined;
  save(item: LegacyDoubleOptInSegment): void;
  remove(code: string): boolean;
  list(): LegacyDoubleOptInSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDoubleOptInSegmentStore implements LegacyDoubleOptInSegmentStore {
  items: Map<string, LegacyDoubleOptInSegment>;
  order: string[];

  constructor(items: Map<string, LegacyDoubleOptInSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDoubleOptInSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDoubleOptInSegment): void {
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

  list(): LegacyDoubleOptInSegment[] {
    const out: LegacyDoubleOptInSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDoubleOptInSegmentStore(): LegacyDoubleOptInSegmentStore {
  return new MemoryLegacyDoubleOptInSegmentStore(new Map<string, LegacyDoubleOptInSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDoubleOptInSegmentStore implements LegacyDoubleOptInSegmentStore {
  inner: LegacyDoubleOptInSegmentStore;
  cache: cache.TtlCache<LegacyDoubleOptInSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDoubleOptInSegmentStore,
    cacheValue: cache.TtlCache<LegacyDoubleOptInSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDoubleOptInSegment | undefined {
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

  save(item: LegacyDoubleOptInSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDoubleOptInSegment[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDoubleOptInSegmentStore(inner: LegacyDoubleOptInSegmentStore, ttl: number, clockValue: clock.Clock): LegacyDoubleOptInSegmentStore {
  return new CachedLegacyDoubleOptInSegmentStore(
    inner,
    cache.newTtlCache<LegacyDoubleOptInSegment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy double opt in segments. Empty fields match all. */
export class LegacyDoubleOptInSegmentQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDoubleOptInSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDoubleOptInSegment[]): LegacyDoubleOptInSegment[] {
    const matched = collections.filter(items, (candidate: LegacyDoubleOptInSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDoubleOptInSegments(store: LegacyDoubleOptInSegmentStore, query: LegacyDoubleOptInSegmentQuery): LegacyDoubleOptInSegment[] {
  return query.apply(store.list());
}
