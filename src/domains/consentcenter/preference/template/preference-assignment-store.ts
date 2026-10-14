import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceAssignment } from "./preference-assignment.js";

/** Keeps preference assignments by code. */
export interface PreferenceAssignmentStore {
  find(code: string): PreferenceAssignment | undefined;
  save(item: PreferenceAssignment): void;
  remove(code: string): boolean;
  list(): PreferenceAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceAssignmentStore implements PreferenceAssignmentStore {
  items: Map<string, PreferenceAssignment>;
  order: string[];

  constructor(items: Map<string, PreferenceAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceAssignment): void {
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

  list(): PreferenceAssignment[] {
    const out: PreferenceAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceAssignmentStore(): PreferenceAssignmentStore {
  return new MemoryPreferenceAssignmentStore(new Map<string, PreferenceAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceAssignmentStore implements PreferenceAssignmentStore {
  inner: PreferenceAssignmentStore;
  cache: cache.TtlCache<PreferenceAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceAssignmentStore,
    cacheValue: cache.TtlCache<PreferenceAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceAssignment | undefined {
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

  save(item: PreferenceAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceAssignmentStore(inner: PreferenceAssignmentStore, ttl: number, clockValue: clock.Clock): PreferenceAssignmentStore {
  return new CachedPreferenceAssignmentStore(inner, cache.newTtlCache<PreferenceAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects preference assignments. Empty fields match all. */
export class PreferenceAssignmentQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceAssignment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceAssignment[]): PreferenceAssignment[] {
    const matched = collections.filter(items, (candidate: PreferenceAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceAssignments(store: PreferenceAssignmentStore, query: PreferenceAssignmentQuery): PreferenceAssignment[] {
  return query.apply(store.list());
}
