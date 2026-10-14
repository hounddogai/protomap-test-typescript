import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationSegment } from "./activation-segment.js";

/** Keeps activation segments by code. */
export interface ActivationSegmentStore {
  find(code: string): ActivationSegment | undefined;
  save(item: ActivationSegment): void;
  remove(code: string): boolean;
  list(): ActivationSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationSegmentStore implements ActivationSegmentStore {
  items: Map<string, ActivationSegment>;
  order: string[];

  constructor(items: Map<string, ActivationSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationSegment): void {
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

  list(): ActivationSegment[] {
    const out: ActivationSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationSegmentStore(): ActivationSegmentStore {
  return new MemoryActivationSegmentStore(new Map<string, ActivationSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationSegmentStore implements ActivationSegmentStore {
  inner: ActivationSegmentStore;
  cache: cache.TtlCache<ActivationSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationSegmentStore,
    cacheValue: cache.TtlCache<ActivationSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationSegment | undefined {
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

  save(item: ActivationSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationSegment[] {
    return this.inner.list();
  }
}

export function newCachedActivationSegmentStore(inner: ActivationSegmentStore, ttl: number, clockValue: clock.Clock): ActivationSegmentStore {
  return new CachedActivationSegmentStore(inner, cache.newTtlCache<ActivationSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects activation segments. Empty fields match all. */
export class ActivationSegmentQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationSegment[]): ActivationSegment[] {
    const matched = collections.filter(items, (candidate: ActivationSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationSegments(store: ActivationSegmentStore, query: ActivationSegmentQuery): ActivationSegment[] {
  return query.apply(store.list());
}
