import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionRollup } from "./scheduled-deflection-rollup.js";

/** Keeps scheduled deflection rollups by code. */
export interface ScheduledDeflectionRollupStore {
  find(code: string): ScheduledDeflectionRollup | undefined;
  save(item: ScheduledDeflectionRollup): void;
  remove(code: string): boolean;
  list(): ScheduledDeflectionRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDeflectionRollupStore implements ScheduledDeflectionRollupStore {
  items: Map<string, ScheduledDeflectionRollup>;
  order: string[];

  constructor(items: Map<string, ScheduledDeflectionRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDeflectionRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDeflectionRollup): void {
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

  list(): ScheduledDeflectionRollup[] {
    const out: ScheduledDeflectionRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDeflectionRollupStore(): ScheduledDeflectionRollupStore {
  return new MemoryScheduledDeflectionRollupStore(new Map<string, ScheduledDeflectionRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDeflectionRollupStore implements ScheduledDeflectionRollupStore {
  inner: ScheduledDeflectionRollupStore;
  cache: cache.TtlCache<ScheduledDeflectionRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDeflectionRollupStore,
    cacheValue: cache.TtlCache<ScheduledDeflectionRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDeflectionRollup | undefined {
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

  save(item: ScheduledDeflectionRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDeflectionRollup[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDeflectionRollupStore(inner: ScheduledDeflectionRollupStore, ttl: number, clockValue: clock.Clock): ScheduledDeflectionRollupStore {
  return new CachedScheduledDeflectionRollupStore(
    inner,
    cache.newTtlCache<ScheduledDeflectionRollup>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled deflection rollups. Empty fields match all. */
export class ScheduledDeflectionRollupQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDeflectionRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDeflectionRollup[]): ScheduledDeflectionRollup[] {
    const matched = collections.filter(items, (candidate: ScheduledDeflectionRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDeflectionRollups(store: ScheduledDeflectionRollupStore, query: ScheduledDeflectionRollupQuery): ScheduledDeflectionRollup[] {
  return query.apply(store.list());
}
