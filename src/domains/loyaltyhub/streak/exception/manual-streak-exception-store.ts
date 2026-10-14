import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualStreakException } from "./manual-streak-exception.js";

/** Keeps manual streak exceptions by code. */
export interface ManualStreakExceptionStore {
  find(code: string): ManualStreakException | undefined;
  save(item: ManualStreakException): void;
  remove(code: string): boolean;
  list(): ManualStreakException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualStreakExceptionStore implements ManualStreakExceptionStore {
  items: Map<string, ManualStreakException>;
  order: string[];

  constructor(items: Map<string, ManualStreakException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualStreakException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualStreakException): void {
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

  list(): ManualStreakException[] {
    const out: ManualStreakException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualStreakExceptionStore(): ManualStreakExceptionStore {
  return new MemoryManualStreakExceptionStore(new Map<string, ManualStreakException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualStreakExceptionStore implements ManualStreakExceptionStore {
  inner: ManualStreakExceptionStore;
  cache: cache.TtlCache<ManualStreakException>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualStreakExceptionStore,
    cacheValue: cache.TtlCache<ManualStreakException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualStreakException | undefined {
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

  save(item: ManualStreakException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualStreakException[] {
    return this.inner.list();
  }
}

export function newCachedManualStreakExceptionStore(inner: ManualStreakExceptionStore, ttl: number, clockValue: clock.Clock): ManualStreakExceptionStore {
  return new CachedManualStreakExceptionStore(
    inner,
    cache.newTtlCache<ManualStreakException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual streak exceptions. Empty fields match all. */
export class ManualStreakExceptionQuery {
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

  matches(item: ManualStreakException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualStreakException[]): ManualStreakException[] {
    const matched = collections.filter(items, (candidate: ManualStreakException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualStreakExceptions(store: ManualStreakExceptionStore, query: ManualStreakExceptionQuery): ManualStreakException[] {
  return query.apply(store.list());
}
