import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBidRuleBatch } from "./rolling-bid-rule-batch.js";

/** Keeps rolling bid rule batches by code. */
export interface RollingBidRuleBatchStore {
  find(code: string): RollingBidRuleBatch | undefined;
  save(item: RollingBidRuleBatch): void;
  remove(code: string): boolean;
  list(): RollingBidRuleBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBidRuleBatchStore implements RollingBidRuleBatchStore {
  items: Map<string, RollingBidRuleBatch>;
  order: string[];

  constructor(items: Map<string, RollingBidRuleBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBidRuleBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBidRuleBatch): void {
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

  list(): RollingBidRuleBatch[] {
    const out: RollingBidRuleBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBidRuleBatchStore(): RollingBidRuleBatchStore {
  return new MemoryRollingBidRuleBatchStore(new Map<string, RollingBidRuleBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBidRuleBatchStore implements RollingBidRuleBatchStore {
  inner: RollingBidRuleBatchStore;
  cache: cache.TtlCache<RollingBidRuleBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBidRuleBatchStore,
    cacheValue: cache.TtlCache<RollingBidRuleBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBidRuleBatch | undefined {
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

  save(item: RollingBidRuleBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBidRuleBatch[] {
    return this.inner.list();
  }
}

export function newCachedRollingBidRuleBatchStore(inner: RollingBidRuleBatchStore, ttl: number, clockValue: clock.Clock): RollingBidRuleBatchStore {
  return new CachedRollingBidRuleBatchStore(inner, cache.newTtlCache<RollingBidRuleBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling bid rule batches. Empty fields match all. */
export class RollingBidRuleBatchQuery {
  region: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minSequence: number, statuses: string[], limit: number) {
    this.region = region;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBidRuleBatch): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBidRuleBatch[]): RollingBidRuleBatch[] {
    const matched = collections.filter(items, (candidate: RollingBidRuleBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBidRuleBatches(store: RollingBidRuleBatchStore, query: RollingBidRuleBatchQuery): RollingBidRuleBatch[] {
  return query.apply(store.list());
}
