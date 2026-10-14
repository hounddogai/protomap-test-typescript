import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDomainScore } from "./lenient-domain-score.js";

/** Keeps lenient domain scores by code. */
export interface LenientDomainScoreStore {
  find(code: string): LenientDomainScore | undefined;
  save(item: LenientDomainScore): void;
  remove(code: string): boolean;
  list(): LenientDomainScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDomainScoreStore implements LenientDomainScoreStore {
  items: Map<string, LenientDomainScore>;
  order: string[];

  constructor(items: Map<string, LenientDomainScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDomainScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDomainScore): void {
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

  list(): LenientDomainScore[] {
    const out: LenientDomainScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDomainScoreStore(): LenientDomainScoreStore {
  return new MemoryLenientDomainScoreStore(new Map<string, LenientDomainScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDomainScoreStore implements LenientDomainScoreStore {
  inner: LenientDomainScoreStore;
  cache: cache.TtlCache<LenientDomainScore>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDomainScoreStore,
    cacheValue: cache.TtlCache<LenientDomainScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDomainScore | undefined {
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

  save(item: LenientDomainScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDomainScore[] {
    return this.inner.list();
  }
}

export function newCachedLenientDomainScoreStore(inner: LenientDomainScoreStore, ttl: number, clockValue: clock.Clock): LenientDomainScoreStore {
  return new CachedLenientDomainScoreStore(inner, cache.newTtlCache<LenientDomainScore>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient domain scores. Empty fields match all. */
export class LenientDomainScoreQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDomainScore): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDomainScore[]): LenientDomainScore[] {
    const matched = collections.filter(items, (candidate: LenientDomainScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDomainScores(store: LenientDomainScoreStore, query: LenientDomainScoreQuery): LenientDomainScore[] {
  return query.apply(store.list());
}
