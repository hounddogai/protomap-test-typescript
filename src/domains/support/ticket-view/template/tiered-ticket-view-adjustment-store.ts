import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTicketViewAdjustment } from "./tiered-ticket-view-adjustment.js";

/** Keeps tiered ticket view adjustments by code. */
export interface TieredTicketViewAdjustmentStore {
  find(code: string): TieredTicketViewAdjustment | undefined;
  save(item: TieredTicketViewAdjustment): void;
  remove(code: string): boolean;
  list(): TieredTicketViewAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTicketViewAdjustmentStore implements TieredTicketViewAdjustmentStore {
  items: Map<string, TieredTicketViewAdjustment>;
  order: string[];

  constructor(items: Map<string, TieredTicketViewAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTicketViewAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTicketViewAdjustment): void {
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

  list(): TieredTicketViewAdjustment[] {
    const out: TieredTicketViewAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTicketViewAdjustmentStore(): TieredTicketViewAdjustmentStore {
  return new MemoryTieredTicketViewAdjustmentStore(new Map<string, TieredTicketViewAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTicketViewAdjustmentStore implements TieredTicketViewAdjustmentStore {
  inner: TieredTicketViewAdjustmentStore;
  cache: cache.TtlCache<TieredTicketViewAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTicketViewAdjustmentStore,
    cacheValue: cache.TtlCache<TieredTicketViewAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTicketViewAdjustment | undefined {
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

  save(item: TieredTicketViewAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTicketViewAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTieredTicketViewAdjustmentStore(inner: TieredTicketViewAdjustmentStore, ttl: number, clockValue: clock.Clock): TieredTicketViewAdjustmentStore {
  return new CachedTieredTicketViewAdjustmentStore(
    inner,
    cache.newTtlCache<TieredTicketViewAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered ticket view adjustments. Empty fields match all. */
export class TieredTicketViewAdjustmentQuery {
  region: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBatchSize: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTicketViewAdjustment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTicketViewAdjustment[]): TieredTicketViewAdjustment[] {
    const matched = collections.filter(items, (candidate: TieredTicketViewAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTicketViewAdjustments(store: TieredTicketViewAdjustmentStore, query: TieredTicketViewAdjustmentQuery): TieredTicketViewAdjustment[] {
  return query.apply(store.list());
}
