import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFrequencyTarget } from "./pending-frequency-target.js";

/** Keeps pending frequency targets by code. */
export interface PendingFrequencyTargetStore {
  find(code: string): PendingFrequencyTarget | undefined;
  save(item: PendingFrequencyTarget): void;
  remove(code: string): boolean;
  list(): PendingFrequencyTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFrequencyTargetStore implements PendingFrequencyTargetStore {
  items: Map<string, PendingFrequencyTarget>;
  order: string[];

  constructor(items: Map<string, PendingFrequencyTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFrequencyTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFrequencyTarget): void {
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

  list(): PendingFrequencyTarget[] {
    const out: PendingFrequencyTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFrequencyTargetStore(): PendingFrequencyTargetStore {
  return new MemoryPendingFrequencyTargetStore(new Map<string, PendingFrequencyTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFrequencyTargetStore implements PendingFrequencyTargetStore {
  inner: PendingFrequencyTargetStore;
  cache: cache.TtlCache<PendingFrequencyTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFrequencyTargetStore,
    cacheValue: cache.TtlCache<PendingFrequencyTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFrequencyTarget | undefined {
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

  save(item: PendingFrequencyTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFrequencyTarget[] {
    return this.inner.list();
  }
}

export function newCachedPendingFrequencyTargetStore(inner: PendingFrequencyTargetStore, ttl: number, clockValue: clock.Clock): PendingFrequencyTargetStore {
  return new CachedPendingFrequencyTargetStore(
    inner,
    cache.newTtlCache<PendingFrequencyTarget>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending frequency targets. Empty fields match all. */
export class PendingFrequencyTargetQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFrequencyTarget): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFrequencyTarget[]): PendingFrequencyTarget[] {
    const matched = collections.filter(items, (candidate: PendingFrequencyTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFrequencyTargets(store: PendingFrequencyTargetStore, query: PendingFrequencyTargetQuery): PendingFrequencyTarget[] {
  return query.apply(store.list());
}
