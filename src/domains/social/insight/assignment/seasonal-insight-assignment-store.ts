import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

/** Keeps seasonal insight assignments by code. */
export interface SeasonalInsightAssignmentStore {
  find(code: string): SeasonalInsightAssignment | undefined;
  save(item: SeasonalInsightAssignment): void;
  remove(code: string): boolean;
  list(): SeasonalInsightAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalInsightAssignmentStore implements SeasonalInsightAssignmentStore {
  items: Map<string, SeasonalInsightAssignment>;
  order: string[];

  constructor(items: Map<string, SeasonalInsightAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalInsightAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalInsightAssignment): void {
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

  list(): SeasonalInsightAssignment[] {
    const out: SeasonalInsightAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalInsightAssignmentStore(): SeasonalInsightAssignmentStore {
  return new MemorySeasonalInsightAssignmentStore(new Map<string, SeasonalInsightAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalInsightAssignmentStore implements SeasonalInsightAssignmentStore {
  inner: SeasonalInsightAssignmentStore;
  cache: cache.TtlCache<SeasonalInsightAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalInsightAssignmentStore,
    cacheValue: cache.TtlCache<SeasonalInsightAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalInsightAssignment | undefined {
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

  save(item: SeasonalInsightAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalInsightAssignment[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalInsightAssignmentStore(inner: SeasonalInsightAssignmentStore, ttl: number, clockValue: clock.Clock): SeasonalInsightAssignmentStore {
  return new CachedSeasonalInsightAssignmentStore(
    inner,
    cache.newTtlCache<SeasonalInsightAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal insight assignments. Empty fields match all. */
export class SeasonalInsightAssignmentQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalInsightAssignment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalInsightAssignment[]): SeasonalInsightAssignment[] {
    const matched = collections.filter(items, (candidate: SeasonalInsightAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalInsightAssignments(store: SeasonalInsightAssignmentStore, query: SeasonalInsightAssignmentQuery): SeasonalInsightAssignment[] {
  return query.apply(store.list());
}
