import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRewardSegment } from "./default-reward-segment.js";

/** Keeps default reward segments by code. */
export interface DefaultRewardSegmentStore {
  find(code: string): DefaultRewardSegment | undefined;
  save(item: DefaultRewardSegment): void;
  remove(code: string): boolean;
  list(): DefaultRewardSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRewardSegmentStore implements DefaultRewardSegmentStore {
  items: Map<string, DefaultRewardSegment>;
  order: string[];

  constructor(items: Map<string, DefaultRewardSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRewardSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRewardSegment): void {
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

  list(): DefaultRewardSegment[] {
    const out: DefaultRewardSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRewardSegmentStore(): DefaultRewardSegmentStore {
  return new MemoryDefaultRewardSegmentStore(new Map<string, DefaultRewardSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRewardSegmentStore implements DefaultRewardSegmentStore {
  inner: DefaultRewardSegmentStore;
  cache: cache.TtlCache<DefaultRewardSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRewardSegmentStore,
    cacheValue: cache.TtlCache<DefaultRewardSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRewardSegment | undefined {
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

  save(item: DefaultRewardSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRewardSegment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRewardSegmentStore(inner: DefaultRewardSegmentStore, ttl: number, clockValue: clock.Clock): DefaultRewardSegmentStore {
  return new CachedDefaultRewardSegmentStore(
    inner,
    cache.newTtlCache<DefaultRewardSegment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default reward segments. Empty fields match all. */
export class DefaultRewardSegmentQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRewardSegment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRewardSegment[]): DefaultRewardSegment[] {
    const matched = collections.filter(items, (candidate: DefaultRewardSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRewardSegments(store: DefaultRewardSegmentStore, query: DefaultRewardSegmentQuery): DefaultRewardSegment[] {
  return query.apply(store.list());
}
