import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteSegment } from "./invite-segment.js";

/** Keeps invite segments by code. */
export interface InviteSegmentStore {
  find(code: string): InviteSegment | undefined;
  save(item: InviteSegment): void;
  remove(code: string): boolean;
  list(): InviteSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteSegmentStore implements InviteSegmentStore {
  items: Map<string, InviteSegment>;
  order: string[];

  constructor(items: Map<string, InviteSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteSegment): void {
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

  list(): InviteSegment[] {
    const out: InviteSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteSegmentStore(): InviteSegmentStore {
  return new MemoryInviteSegmentStore(new Map<string, InviteSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteSegmentStore implements InviteSegmentStore {
  inner: InviteSegmentStore;
  cache: cache.TtlCache<InviteSegment>;
  hits: number;
  misses: number;

  constructor(inner: InviteSegmentStore, cacheValue: cache.TtlCache<InviteSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteSegment | undefined {
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

  save(item: InviteSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteSegment[] {
    return this.inner.list();
  }
}

export function newCachedInviteSegmentStore(inner: InviteSegmentStore, ttl: number, clockValue: clock.Clock): InviteSegmentStore {
  return new CachedInviteSegmentStore(inner, cache.newTtlCache<InviteSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects invite segments. Empty fields match all. */
export class InviteSegmentQuery {
  source: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteSegment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteSegment[]): InviteSegment[] {
    const matched = collections.filter(items, (candidate: InviteSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteSegments(store: InviteSegmentStore, query: InviteSegmentQuery): InviteSegment[] {
  return query.apply(store.list());
}
