import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintScore } from "./complaint-score.js";

/** Keeps complaint scores by code. */
export interface ComplaintScoreStore {
  find(code: string): ComplaintScore | undefined;
  save(item: ComplaintScore): void;
  remove(code: string): boolean;
  list(): ComplaintScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintScoreStore implements ComplaintScoreStore {
  items: Map<string, ComplaintScore>;
  order: string[];

  constructor(items: Map<string, ComplaintScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintScore): void {
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

  list(): ComplaintScore[] {
    const out: ComplaintScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintScoreStore(): ComplaintScoreStore {
  return new MemoryComplaintScoreStore(new Map<string, ComplaintScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintScoreStore implements ComplaintScoreStore {
  inner: ComplaintScoreStore;
  cache: cache.TtlCache<ComplaintScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintScoreStore,
    cacheValue: cache.TtlCache<ComplaintScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintScore | undefined {
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

  save(item: ComplaintScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintScore[] {
    return this.inner.list();
  }
}

export function newCachedComplaintScoreStore(inner: ComplaintScoreStore, ttl: number, clockValue: clock.Clock): ComplaintScoreStore {
  return new CachedComplaintScoreStore(inner, cache.newTtlCache<ComplaintScore>(128, ttl, clockValue), 0, 0);
}

/** Selects complaint scores. Empty fields match all. */
export class ComplaintScoreQuery {
  category: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintScore): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintScore[]): ComplaintScore[] {
    const matched = collections.filter(items, (candidate: ComplaintScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintScores(store: ComplaintScoreStore, query: ComplaintScoreQuery): ComplaintScore[] {
  return query.apply(store.list());
}
