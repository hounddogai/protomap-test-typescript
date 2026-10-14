import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultTierSegment } from "./default-tier-segment.js";

/** Keeps default tier segments by code. */
export interface DefaultTierSegmentStore {
  find(code: string): DefaultTierSegment | undefined;
  save(item: DefaultTierSegment): void;
  remove(code: string): boolean;
  list(): DefaultTierSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultTierSegmentStore implements DefaultTierSegmentStore {
  items: Map<string, DefaultTierSegment>;
  order: string[];

  constructor(items: Map<string, DefaultTierSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultTierSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultTierSegment): void {
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

  list(): DefaultTierSegment[] {
    const out: DefaultTierSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultTierSegmentStore(): DefaultTierSegmentStore {
  return new MemoryDefaultTierSegmentStore(new Map<string, DefaultTierSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultTierSegmentStore implements DefaultTierSegmentStore {
  inner: DefaultTierSegmentStore;
  cache: cache.TtlCache<DefaultTierSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultTierSegmentStore,
    cacheValue: cache.TtlCache<DefaultTierSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultTierSegment | undefined {
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

  save(item: DefaultTierSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultTierSegment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultTierSegmentStore(inner: DefaultTierSegmentStore, ttl: number, clockValue: clock.Clock): DefaultTierSegmentStore {
  return new CachedDefaultTierSegmentStore(inner, cache.newTtlCache<DefaultTierSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects default tier segments. Empty fields match all. */
export class DefaultTierSegmentQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultTierSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultTierSegment[]): DefaultTierSegment[] {
    const matched = collections.filter(items, (candidate: DefaultTierSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultTierSegments(store: DefaultTierSegmentStore, query: DefaultTierSegmentQuery): DefaultTierSegment[] {
  return query.apply(store.list());
}
