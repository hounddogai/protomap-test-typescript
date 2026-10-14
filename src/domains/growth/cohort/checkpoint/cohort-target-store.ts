import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortTarget } from "./cohort-target.js";

/** Keeps cohort targets by code. */
export interface CohortTargetStore {
  find(code: string): CohortTarget | undefined;
  save(item: CohortTarget): void;
  remove(code: string): boolean;
  list(): CohortTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortTargetStore implements CohortTargetStore {
  items: Map<string, CohortTarget>;
  order: string[];

  constructor(items: Map<string, CohortTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortTarget): void {
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

  list(): CohortTarget[] {
    const out: CohortTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortTargetStore(): CohortTargetStore {
  return new MemoryCohortTargetStore(new Map<string, CohortTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortTargetStore implements CohortTargetStore {
  inner: CohortTargetStore;
  cache: cache.TtlCache<CohortTarget>;
  hits: number;
  misses: number;

  constructor(inner: CohortTargetStore, cacheValue: cache.TtlCache<CohortTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortTarget | undefined {
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

  save(item: CohortTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortTarget[] {
    return this.inner.list();
  }
}

export function newCachedCohortTargetStore(inner: CohortTargetStore, ttl: number, clockValue: clock.Clock): CohortTargetStore {
  return new CachedCohortTargetStore(inner, cache.newTtlCache<CohortTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects cohort targets. Empty fields match all. */
export class CohortTargetQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortTarget[]): CohortTarget[] {
    const matched = collections.filter(items, (candidate: CohortTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortTargets(store: CohortTargetStore, query: CohortTargetQuery): CohortTarget[] {
  return query.apply(store.list());
}
