import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceSegment } from "./preference-segment.js";

/** Keeps preference segments by code. */
export interface PreferenceSegmentStore {
  find(code: string): PreferenceSegment | undefined;
  save(item: PreferenceSegment): void;
  remove(code: string): boolean;
  list(): PreferenceSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceSegmentStore implements PreferenceSegmentStore {
  items: Map<string, PreferenceSegment>;
  order: string[];

  constructor(items: Map<string, PreferenceSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceSegment): void {
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

  list(): PreferenceSegment[] {
    const out: PreferenceSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceSegmentStore(): PreferenceSegmentStore {
  return new MemoryPreferenceSegmentStore(new Map<string, PreferenceSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceSegmentStore implements PreferenceSegmentStore {
  inner: PreferenceSegmentStore;
  cache: cache.TtlCache<PreferenceSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceSegmentStore,
    cacheValue: cache.TtlCache<PreferenceSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceSegment | undefined {
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

  save(item: PreferenceSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceSegment[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceSegmentStore(inner: PreferenceSegmentStore, ttl: number, clockValue: clock.Clock): PreferenceSegmentStore {
  return new CachedPreferenceSegmentStore(inner, cache.newTtlCache<PreferenceSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects preference segments. Empty fields match all. */
export class PreferenceSegmentQuery {
  utmSource: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWindowDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceSegment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceSegment[]): PreferenceSegment[] {
    const matched = collections.filter(items, (candidate: PreferenceSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceSegments(store: PreferenceSegmentStore, query: PreferenceSegmentQuery): PreferenceSegment[] {
  return query.apply(store.list());
}
