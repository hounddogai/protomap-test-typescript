import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPreferenceSegment } from "./default-preference-segment.js";

/** Keeps default preference segments by code. */
export interface DefaultPreferenceSegmentStore {
  find(code: string): DefaultPreferenceSegment | undefined;
  save(item: DefaultPreferenceSegment): void;
  remove(code: string): boolean;
  list(): DefaultPreferenceSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPreferenceSegmentStore implements DefaultPreferenceSegmentStore {
  items: Map<string, DefaultPreferenceSegment>;
  order: string[];

  constructor(items: Map<string, DefaultPreferenceSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPreferenceSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPreferenceSegment): void {
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

  list(): DefaultPreferenceSegment[] {
    const out: DefaultPreferenceSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPreferenceSegmentStore(): DefaultPreferenceSegmentStore {
  return new MemoryDefaultPreferenceSegmentStore(new Map<string, DefaultPreferenceSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPreferenceSegmentStore implements DefaultPreferenceSegmentStore {
  inner: DefaultPreferenceSegmentStore;
  cache: cache.TtlCache<DefaultPreferenceSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPreferenceSegmentStore,
    cacheValue: cache.TtlCache<DefaultPreferenceSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPreferenceSegment | undefined {
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

  save(item: DefaultPreferenceSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPreferenceSegment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPreferenceSegmentStore(inner: DefaultPreferenceSegmentStore, ttl: number, clockValue: clock.Clock): DefaultPreferenceSegmentStore {
  return new CachedDefaultPreferenceSegmentStore(
    inner,
    cache.newTtlCache<DefaultPreferenceSegment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default preference segments. Empty fields match all. */
export class DefaultPreferenceSegmentQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPreferenceSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPreferenceSegment[]): DefaultPreferenceSegment[] {
    const matched = collections.filter(items, (candidate: DefaultPreferenceSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPreferenceSegments(store: DefaultPreferenceSegmentStore, query: DefaultPreferenceSegmentQuery): DefaultPreferenceSegment[] {
  return query.apply(store.list());
}
