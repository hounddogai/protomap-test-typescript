import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledRetentionCycle } from "./scheduled-retention-cycle.js";

/** Keeps scheduled retention cycles by code. */
export interface ScheduledRetentionCycleStore {
  find(code: string): ScheduledRetentionCycle | undefined;
  save(item: ScheduledRetentionCycle): void;
  remove(code: string): boolean;
  list(): ScheduledRetentionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledRetentionCycleStore implements ScheduledRetentionCycleStore {
  items: Map<string, ScheduledRetentionCycle>;
  order: string[];

  constructor(items: Map<string, ScheduledRetentionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledRetentionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledRetentionCycle): void {
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

  list(): ScheduledRetentionCycle[] {
    const out: ScheduledRetentionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledRetentionCycleStore(): ScheduledRetentionCycleStore {
  return new MemoryScheduledRetentionCycleStore(new Map<string, ScheduledRetentionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledRetentionCycleStore implements ScheduledRetentionCycleStore {
  inner: ScheduledRetentionCycleStore;
  cache: cache.TtlCache<ScheduledRetentionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledRetentionCycleStore,
    cacheValue: cache.TtlCache<ScheduledRetentionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledRetentionCycle | undefined {
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

  save(item: ScheduledRetentionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledRetentionCycle[] {
    return this.inner.list();
  }
}

export function newCachedScheduledRetentionCycleStore(inner: ScheduledRetentionCycleStore, ttl: number, clockValue: clock.Clock): ScheduledRetentionCycleStore {
  return new CachedScheduledRetentionCycleStore(
    inner,
    cache.newTtlCache<ScheduledRetentionCycle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled retention cycles. Empty fields match all. */
export class ScheduledRetentionCycleQuery {
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

  matches(item: ScheduledRetentionCycle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledRetentionCycle[]): ScheduledRetentionCycle[] {
    const matched = collections.filter(items, (candidate: ScheduledRetentionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledRetentionCycles(store: ScheduledRetentionCycleStore, query: ScheduledRetentionCycleQuery): ScheduledRetentionCycle[] {
  return query.apply(store.list());
}
