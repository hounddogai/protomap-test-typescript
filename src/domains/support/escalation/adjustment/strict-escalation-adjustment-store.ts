import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictEscalationAdjustment } from "./strict-escalation-adjustment.js";

/** Keeps strict escalation adjustments by code. */
export interface StrictEscalationAdjustmentStore {
  find(code: string): StrictEscalationAdjustment | undefined;
  save(item: StrictEscalationAdjustment): void;
  remove(code: string): boolean;
  list(): StrictEscalationAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictEscalationAdjustmentStore implements StrictEscalationAdjustmentStore {
  items: Map<string, StrictEscalationAdjustment>;
  order: string[];

  constructor(items: Map<string, StrictEscalationAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictEscalationAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictEscalationAdjustment): void {
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

  list(): StrictEscalationAdjustment[] {
    const out: StrictEscalationAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictEscalationAdjustmentStore(): StrictEscalationAdjustmentStore {
  return new MemoryStrictEscalationAdjustmentStore(new Map<string, StrictEscalationAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictEscalationAdjustmentStore implements StrictEscalationAdjustmentStore {
  inner: StrictEscalationAdjustmentStore;
  cache: cache.TtlCache<StrictEscalationAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictEscalationAdjustmentStore,
    cacheValue: cache.TtlCache<StrictEscalationAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictEscalationAdjustment | undefined {
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

  save(item: StrictEscalationAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictEscalationAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedStrictEscalationAdjustmentStore(inner: StrictEscalationAdjustmentStore, ttl: number, clockValue: clock.Clock): StrictEscalationAdjustmentStore {
  return new CachedStrictEscalationAdjustmentStore(
    inner,
    cache.newTtlCache<StrictEscalationAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict escalation adjustments. Empty fields match all. */
export class StrictEscalationAdjustmentQuery {
  region: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDiscount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictEscalationAdjustment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictEscalationAdjustment[]): StrictEscalationAdjustment[] {
    const matched = collections.filter(items, (candidate: StrictEscalationAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictEscalationAdjustments(store: StrictEscalationAdjustmentStore, query: StrictEscalationAdjustmentQuery): StrictEscalationAdjustment[] {
  return query.apply(store.list());
}
