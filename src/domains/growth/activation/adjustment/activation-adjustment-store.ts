import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationAdjustment } from "./activation-adjustment.js";

/** Keeps activation adjustments by code. */
export interface ActivationAdjustmentStore {
  find(code: string): ActivationAdjustment | undefined;
  save(item: ActivationAdjustment): void;
  remove(code: string): boolean;
  list(): ActivationAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationAdjustmentStore implements ActivationAdjustmentStore {
  items: Map<string, ActivationAdjustment>;
  order: string[];

  constructor(items: Map<string, ActivationAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationAdjustment): void {
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

  list(): ActivationAdjustment[] {
    const out: ActivationAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationAdjustmentStore(): ActivationAdjustmentStore {
  return new MemoryActivationAdjustmentStore(new Map<string, ActivationAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationAdjustmentStore implements ActivationAdjustmentStore {
  inner: ActivationAdjustmentStore;
  cache: cache.TtlCache<ActivationAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationAdjustmentStore,
    cacheValue: cache.TtlCache<ActivationAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationAdjustment | undefined {
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

  save(item: ActivationAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedActivationAdjustmentStore(inner: ActivationAdjustmentStore, ttl: number, clockValue: clock.Clock): ActivationAdjustmentStore {
  return new CachedActivationAdjustmentStore(inner, cache.newTtlCache<ActivationAdjustment>(64, ttl, clockValue), 0, 0);
}

/** Selects activation adjustments. Empty fields match all. */
export class ActivationAdjustmentQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationAdjustment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationAdjustment[]): ActivationAdjustment[] {
    const matched = collections.filter(items, (candidate: ActivationAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationAdjustments(store: ActivationAdjustmentStore, query: ActivationAdjustmentQuery): ActivationAdjustment[] {
  return query.apply(store.list());
}
