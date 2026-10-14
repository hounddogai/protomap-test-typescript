import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualDomainScore } from "./manual-domain-score.js";

/** Keeps manual domain scores by code. */
export interface ManualDomainScoreStore {
  find(code: string): ManualDomainScore | undefined;
  save(item: ManualDomainScore): void;
  remove(code: string): boolean;
  list(): ManualDomainScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualDomainScoreStore implements ManualDomainScoreStore {
  items: Map<string, ManualDomainScore>;
  order: string[];

  constructor(items: Map<string, ManualDomainScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualDomainScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualDomainScore): void {
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

  list(): ManualDomainScore[] {
    const out: ManualDomainScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualDomainScoreStore(): ManualDomainScoreStore {
  return new MemoryManualDomainScoreStore(new Map<string, ManualDomainScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualDomainScoreStore implements ManualDomainScoreStore {
  inner: ManualDomainScoreStore;
  cache: cache.TtlCache<ManualDomainScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualDomainScoreStore,
    cacheValue: cache.TtlCache<ManualDomainScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualDomainScore | undefined {
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

  save(item: ManualDomainScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualDomainScore[] {
    return this.inner.list();
  }
}

export function newCachedManualDomainScoreStore(inner: ManualDomainScoreStore, ttl: number, clockValue: clock.Clock): ManualDomainScoreStore {
  return new CachedManualDomainScoreStore(inner, cache.newTtlCache<ManualDomainScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual domain scores. Empty fields match all. */
export class ManualDomainScoreQuery {
  segment: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSendAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualDomainScore): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualDomainScore[]): ManualDomainScore[] {
    const matched = collections.filter(items, (candidate: ManualDomainScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualDomainScores(store: ManualDomainScoreStore, query: ManualDomainScoreQuery): ManualDomainScore[] {
  return query.apply(store.list());
}
