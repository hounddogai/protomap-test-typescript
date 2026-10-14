import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaRollup } from "./sla-rollup.js";

/** Keeps sla rollups by code. */
export interface SlaRollupStore {
  find(code: string): SlaRollup | undefined;
  save(item: SlaRollup): void;
  remove(code: string): boolean;
  list(): SlaRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaRollupStore implements SlaRollupStore {
  items: Map<string, SlaRollup>;
  order: string[];

  constructor(items: Map<string, SlaRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaRollup): void {
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

  list(): SlaRollup[] {
    const out: SlaRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaRollupStore(): SlaRollupStore {
  return new MemorySlaRollupStore(new Map<string, SlaRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaRollupStore implements SlaRollupStore {
  inner: SlaRollupStore;
  cache: cache.TtlCache<SlaRollup>;
  hits: number;
  misses: number;

  constructor(inner: SlaRollupStore, cacheValue: cache.TtlCache<SlaRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaRollup | undefined {
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

  save(item: SlaRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaRollup[] {
    return this.inner.list();
  }
}

export function newCachedSlaRollupStore(inner: SlaRollupStore, ttl: number, clockValue: clock.Clock): SlaRollupStore {
  return new CachedSlaRollupStore(inner, cache.newTtlCache<SlaRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects sla rollups. Empty fields match all. */
export class SlaRollupQuery {
  utmSource: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBatchSize: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaRollup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaRollup[]): SlaRollup[] {
    const matched = collections.filter(items, (candidate: SlaRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaRollups(store: SlaRollupStore, query: SlaRollupQuery): SlaRollup[] {
  return query.apply(store.list());
}
