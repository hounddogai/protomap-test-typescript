import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalSegment } from "./approval-segment.js";

/** Keeps approval segments by code. */
export interface ApprovalSegmentStore {
  find(code: string): ApprovalSegment | undefined;
  save(item: ApprovalSegment): void;
  remove(code: string): boolean;
  list(): ApprovalSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalSegmentStore implements ApprovalSegmentStore {
  items: Map<string, ApprovalSegment>;
  order: string[];

  constructor(items: Map<string, ApprovalSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalSegment): void {
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

  list(): ApprovalSegment[] {
    const out: ApprovalSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalSegmentStore(): ApprovalSegmentStore {
  return new MemoryApprovalSegmentStore(new Map<string, ApprovalSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalSegmentStore implements ApprovalSegmentStore {
  inner: ApprovalSegmentStore;
  cache: cache.TtlCache<ApprovalSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalSegmentStore,
    cacheValue: cache.TtlCache<ApprovalSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalSegment | undefined {
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

  save(item: ApprovalSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalSegment[] {
    return this.inner.list();
  }
}

export function newCachedApprovalSegmentStore(inner: ApprovalSegmentStore, ttl: number, clockValue: clock.Clock): ApprovalSegmentStore {
  return new CachedApprovalSegmentStore(inner, cache.newTtlCache<ApprovalSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects approval segments. Empty fields match all. */
export class ApprovalSegmentQuery {
  category: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRevision: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalSegment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalSegment[]): ApprovalSegment[] {
    const matched = collections.filter(items, (candidate: ApprovalSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalSegments(store: ApprovalSegmentStore, query: ApprovalSegmentQuery): ApprovalSegment[] {
  return query.apply(store.list());
}
