import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCohortException } from "./rolling-cohort-exception.js";

/** Keeps rolling cohort exceptions by code. */
export interface RollingCohortExceptionStore {
  find(code: string): RollingCohortException | undefined;
  save(item: RollingCohortException): void;
  remove(code: string): boolean;
  list(): RollingCohortException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCohortExceptionStore implements RollingCohortExceptionStore {
  items: Map<string, RollingCohortException>;
  order: string[];

  constructor(items: Map<string, RollingCohortException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCohortException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCohortException): void {
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

  list(): RollingCohortException[] {
    const out: RollingCohortException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCohortExceptionStore(): RollingCohortExceptionStore {
  return new MemoryRollingCohortExceptionStore(new Map<string, RollingCohortException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCohortExceptionStore implements RollingCohortExceptionStore {
  inner: RollingCohortExceptionStore;
  cache: cache.TtlCache<RollingCohortException>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCohortExceptionStore,
    cacheValue: cache.TtlCache<RollingCohortException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCohortException | undefined {
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

  save(item: RollingCohortException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCohortException[] {
    return this.inner.list();
  }
}

export function newCachedRollingCohortExceptionStore(inner: RollingCohortExceptionStore, ttl: number, clockValue: clock.Clock): RollingCohortExceptionStore {
  return new CachedRollingCohortExceptionStore(
    inner,
    cache.newTtlCache<RollingCohortException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling cohort exceptions. Empty fields match all. */
export class RollingCohortExceptionQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCohortException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCohortException[]): RollingCohortException[] {
    const matched = collections.filter(items, (candidate: RollingCohortException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCohortExceptions(store: RollingCohortExceptionStore, query: RollingCohortExceptionQuery): RollingCohortException[] {
  return query.apply(store.list());
}
