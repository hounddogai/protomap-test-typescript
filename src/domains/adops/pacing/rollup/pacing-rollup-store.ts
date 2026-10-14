import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingRollup } from "./pacing-rollup.js";

/** Keeps pacing rollups by code. */
export interface PacingRollupStore {
  find(code: string): PacingRollup | undefined;
  save(item: PacingRollup): void;
  remove(code: string): boolean;
  list(): PacingRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingRollupStore implements PacingRollupStore {
  items: Map<string, PacingRollup>;
  order: string[];

  constructor(items: Map<string, PacingRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingRollup): void {
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

  list(): PacingRollup[] {
    const out: PacingRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingRollupStore(): PacingRollupStore {
  return new MemoryPacingRollupStore(new Map<string, PacingRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingRollupStore implements PacingRollupStore {
  inner: PacingRollupStore;
  cache: cache.TtlCache<PacingRollup>;
  hits: number;
  misses: number;

  constructor(inner: PacingRollupStore, cacheValue: cache.TtlCache<PacingRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingRollup | undefined {
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

  save(item: PacingRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingRollup[] {
    return this.inner.list();
  }
}

export function newCachedPacingRollupStore(inner: PacingRollupStore, ttl: number, clockValue: clock.Clock): PacingRollupStore {
  return new CachedPacingRollupStore(inner, cache.newTtlCache<PacingRollup>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing rollups. Empty fields match all. */
export class PacingRollupQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingRollup[]): PacingRollup[] {
    const matched = collections.filter(items, (candidate: PacingRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingRollups(store: PacingRollupStore, query: PacingRollupQuery): PacingRollup[] {
  return query.apply(store.list());
}
