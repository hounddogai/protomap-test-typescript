import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPreferenceAssignment } from "./capped-preference-assignment.js";

/** Keeps capped preference assignments by code. */
export interface CappedPreferenceAssignmentStore {
  find(code: string): CappedPreferenceAssignment | undefined;
  save(item: CappedPreferenceAssignment): void;
  remove(code: string): boolean;
  list(): CappedPreferenceAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPreferenceAssignmentStore implements CappedPreferenceAssignmentStore {
  items: Map<string, CappedPreferenceAssignment>;
  order: string[];

  constructor(items: Map<string, CappedPreferenceAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPreferenceAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPreferenceAssignment): void {
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

  list(): CappedPreferenceAssignment[] {
    const out: CappedPreferenceAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPreferenceAssignmentStore(): CappedPreferenceAssignmentStore {
  return new MemoryCappedPreferenceAssignmentStore(new Map<string, CappedPreferenceAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPreferenceAssignmentStore implements CappedPreferenceAssignmentStore {
  inner: CappedPreferenceAssignmentStore;
  cache: cache.TtlCache<CappedPreferenceAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPreferenceAssignmentStore,
    cacheValue: cache.TtlCache<CappedPreferenceAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPreferenceAssignment | undefined {
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

  save(item: CappedPreferenceAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPreferenceAssignment[] {
    return this.inner.list();
  }
}

export function newCachedCappedPreferenceAssignmentStore(inner: CappedPreferenceAssignmentStore, ttl: number, clockValue: clock.Clock): CappedPreferenceAssignmentStore {
  return new CachedCappedPreferenceAssignmentStore(
    inner,
    cache.newTtlCache<CappedPreferenceAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped preference assignments. Empty fields match all. */
export class CappedPreferenceAssignmentQuery {
  source: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRatio: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPreferenceAssignment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPreferenceAssignment[]): CappedPreferenceAssignment[] {
    const matched = collections.filter(items, (candidate: CappedPreferenceAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPreferenceAssignments(store: CappedPreferenceAssignmentStore, query: CappedPreferenceAssignmentQuery): CappedPreferenceAssignment[] {
  return query.apply(store.list());
}
