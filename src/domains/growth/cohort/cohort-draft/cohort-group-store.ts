import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortGroup } from "./cohort-group.js";

/** Keeps cohort groups by code. */
export interface CohortGroupStore {
  find(code: string): CohortGroup | undefined;
  save(item: CohortGroup): void;
  remove(code: string): boolean;
  list(): CohortGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortGroupStore implements CohortGroupStore {
  items: Map<string, CohortGroup>;
  order: string[];

  constructor(items: Map<string, CohortGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortGroup): void {
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

  list(): CohortGroup[] {
    const out: CohortGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortGroupStore(): CohortGroupStore {
  return new MemoryCohortGroupStore(new Map<string, CohortGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortGroupStore implements CohortGroupStore {
  inner: CohortGroupStore;
  cache: cache.TtlCache<CohortGroup>;
  hits: number;
  misses: number;

  constructor(inner: CohortGroupStore, cacheValue: cache.TtlCache<CohortGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortGroup | undefined {
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

  save(item: CohortGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortGroup[] {
    return this.inner.list();
  }
}

export function newCachedCohortGroupStore(inner: CohortGroupStore, ttl: number, clockValue: clock.Clock): CohortGroupStore {
  return new CachedCohortGroupStore(inner, cache.newTtlCache<CohortGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort groups. Empty fields match all. */
export class CohortGroupQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortGroup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortGroup[]): CohortGroup[] {
    const matched = collections.filter(items, (candidate: CohortGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortGroups(store: CohortGroupStore, query: CohortGroupQuery): CohortGroup[] {
  return query.apply(store.list());
}
