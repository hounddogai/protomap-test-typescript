import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeBaseline } from "./challenge-baseline.js";

/** Keeps challenge baselines by code. */
export interface ChallengeBaselineStore {
  find(code: string): ChallengeBaseline | undefined;
  save(item: ChallengeBaseline): void;
  remove(code: string): boolean;
  list(): ChallengeBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeBaselineStore implements ChallengeBaselineStore {
  items: Map<string, ChallengeBaseline>;
  order: string[];

  constructor(items: Map<string, ChallengeBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeBaseline): void {
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

  list(): ChallengeBaseline[] {
    const out: ChallengeBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeBaselineStore(): ChallengeBaselineStore {
  return new MemoryChallengeBaselineStore(new Map<string, ChallengeBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeBaselineStore implements ChallengeBaselineStore {
  inner: ChallengeBaselineStore;
  cache: cache.TtlCache<ChallengeBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeBaselineStore,
    cacheValue: cache.TtlCache<ChallengeBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeBaseline | undefined {
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

  save(item: ChallengeBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeBaseline[] {
    return this.inner.list();
  }
}

export function newCachedChallengeBaselineStore(inner: ChallengeBaselineStore, ttl: number, clockValue: clock.Clock): ChallengeBaselineStore {
  return new CachedChallengeBaselineStore(inner, cache.newTtlCache<ChallengeBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects challenge baselines. Empty fields match all. */
export class ChallengeBaselineQuery {
  segment: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRatio: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeBaseline): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeBaseline[]): ChallengeBaseline[] {
    const matched = collections.filter(items, (candidate: ChallengeBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeBaselines(store: ChallengeBaselineStore, query: ChallengeBaselineQuery): ChallengeBaseline[] {
  return query.apply(store.list());
}
