import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryEscalationAdjustment } from "./primary-escalation-adjustment.js";

/** Keeps primary escalation adjustments by code. */
export interface PrimaryEscalationAdjustmentStore {
  find(code: string): PrimaryEscalationAdjustment | undefined;
  save(item: PrimaryEscalationAdjustment): void;
  remove(code: string): boolean;
  list(): PrimaryEscalationAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryEscalationAdjustmentStore implements PrimaryEscalationAdjustmentStore {
  items: Map<string, PrimaryEscalationAdjustment>;
  order: string[];

  constructor(items: Map<string, PrimaryEscalationAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryEscalationAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryEscalationAdjustment): void {
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

  list(): PrimaryEscalationAdjustment[] {
    const out: PrimaryEscalationAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryEscalationAdjustmentStore(): PrimaryEscalationAdjustmentStore {
  return new MemoryPrimaryEscalationAdjustmentStore(new Map<string, PrimaryEscalationAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryEscalationAdjustmentStore implements PrimaryEscalationAdjustmentStore {
  inner: PrimaryEscalationAdjustmentStore;
  cache: cache.TtlCache<PrimaryEscalationAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryEscalationAdjustmentStore,
    cacheValue: cache.TtlCache<PrimaryEscalationAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryEscalationAdjustment | undefined {
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

  save(item: PrimaryEscalationAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryEscalationAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryEscalationAdjustmentStore(inner: PrimaryEscalationAdjustmentStore, ttl: number, clockValue: clock.Clock): PrimaryEscalationAdjustmentStore {
  return new CachedPrimaryEscalationAdjustmentStore(
    inner,
    cache.newTtlCache<PrimaryEscalationAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary escalation adjustments. Empty fields match all. */
export class PrimaryEscalationAdjustmentQuery {
  category: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minConversionRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryEscalationAdjustment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryEscalationAdjustment[]): PrimaryEscalationAdjustment[] {
    const matched = collections.filter(items, (candidate: PrimaryEscalationAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryEscalationAdjustments(store: PrimaryEscalationAdjustmentStore, query: PrimaryEscalationAdjustmentQuery): PrimaryEscalationAdjustment[] {
  return query.apply(store.list());
}
