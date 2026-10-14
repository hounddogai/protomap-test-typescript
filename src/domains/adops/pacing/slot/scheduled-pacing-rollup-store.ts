import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPacingRollup } from "./scheduled-pacing-rollup.js";

/** Keeps scheduled pacing rollups by code. */
export interface ScheduledPacingRollupStore {
  find(code: string): ScheduledPacingRollup | undefined;
  save(item: ScheduledPacingRollup): void;
  remove(code: string): boolean;
  list(): ScheduledPacingRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPacingRollupStore implements ScheduledPacingRollupStore {
  items: Map<string, ScheduledPacingRollup>;
  order: string[];

  constructor(items: Map<string, ScheduledPacingRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPacingRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPacingRollup): void {
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

  list(): ScheduledPacingRollup[] {
    const out: ScheduledPacingRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPacingRollupStore(): ScheduledPacingRollupStore {
  return new MemoryScheduledPacingRollupStore(new Map<string, ScheduledPacingRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPacingRollupStore implements ScheduledPacingRollupStore {
  inner: ScheduledPacingRollupStore;
  cache: cache.TtlCache<ScheduledPacingRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPacingRollupStore,
    cacheValue: cache.TtlCache<ScheduledPacingRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPacingRollup | undefined {
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

  save(item: ScheduledPacingRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPacingRollup[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPacingRollupStore(inner: ScheduledPacingRollupStore, ttl: number, clockValue: clock.Clock): ScheduledPacingRollupStore {
  return new CachedScheduledPacingRollupStore(
    inner,
    cache.newTtlCache<ScheduledPacingRollup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled pacing rollups. Empty fields match all. */
export class ScheduledPacingRollupQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPacingRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPacingRollup[]): ScheduledPacingRollup[] {
    const matched = collections.filter(items, (candidate: ScheduledPacingRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPacingRollups(store: ScheduledPacingRollupStore, query: ScheduledPacingRollupQuery): ScheduledPacingRollup[] {
  return query.apply(store.list());
}
