import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionSegment } from "./mention-segment.js";

/** Keeps mention segments by code. */
export interface MentionSegmentStore {
  find(code: string): MentionSegment | undefined;
  save(item: MentionSegment): void;
  remove(code: string): boolean;
  list(): MentionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionSegmentStore implements MentionSegmentStore {
  items: Map<string, MentionSegment>;
  order: string[];

  constructor(items: Map<string, MentionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionSegment): void {
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

  list(): MentionSegment[] {
    const out: MentionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionSegmentStore(): MentionSegmentStore {
  return new MemoryMentionSegmentStore(new Map<string, MentionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionSegmentStore implements MentionSegmentStore {
  inner: MentionSegmentStore;
  cache: cache.TtlCache<MentionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionSegmentStore,
    cacheValue: cache.TtlCache<MentionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionSegment | undefined {
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

  save(item: MentionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionSegment[] {
    return this.inner.list();
  }
}

export function newCachedMentionSegmentStore(inner: MentionSegmentStore, ttl: number, clockValue: clock.Clock): MentionSegmentStore {
  return new CachedMentionSegmentStore(inner, cache.newTtlCache<MentionSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention segments. Empty fields match all. */
export class MentionSegmentQuery {
  country: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minScore: number, statuses: string[], limit: number) {
    this.country = country;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionSegment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionSegment[]): MentionSegment[] {
    const matched = collections.filter(items, (candidate: MentionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionSegments(store: MentionSegmentStore, query: MentionSegmentQuery): MentionSegment[] {
  return query.apply(store.list());
}
