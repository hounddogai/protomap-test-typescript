import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeRollup } from "./creative-rollup.js";

/** Keeps creative rollups by code. */
export interface CreativeRollupStore {
  find(code: string): CreativeRollup | undefined;
  save(item: CreativeRollup): void;
  remove(code: string): boolean;
  list(): CreativeRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeRollupStore implements CreativeRollupStore {
  items: Map<string, CreativeRollup>;
  order: string[];

  constructor(items: Map<string, CreativeRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeRollup): void {
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

  list(): CreativeRollup[] {
    const out: CreativeRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeRollupStore(): CreativeRollupStore {
  return new MemoryCreativeRollupStore(new Map<string, CreativeRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeRollupStore implements CreativeRollupStore {
  inner: CreativeRollupStore;
  cache: cache.TtlCache<CreativeRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeRollupStore,
    cacheValue: cache.TtlCache<CreativeRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeRollup | undefined {
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

  save(item: CreativeRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeRollup[] {
    return this.inner.list();
  }
}

export function newCachedCreativeRollupStore(inner: CreativeRollupStore, ttl: number, clockValue: clock.Clock): CreativeRollupStore {
  return new CachedCreativeRollupStore(inner, cache.newTtlCache<CreativeRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects creative rollups. Empty fields match all. */
export class CreativeRollupQuery {
  source: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeRollup): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeRollup[]): CreativeRollup[] {
    const matched = collections.filter(items, (candidate: CreativeRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeRollups(store: CreativeRollupStore, query: CreativeRollupQuery): CreativeRollup[] {
  return query.apply(store.list());
}
