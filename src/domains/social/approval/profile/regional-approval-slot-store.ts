import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalApprovalSlot } from "./regional-approval-slot.js";

/** Keeps regional approval slots by code. */
export interface RegionalApprovalSlotStore {
  find(code: string): RegionalApprovalSlot | undefined;
  save(item: RegionalApprovalSlot): void;
  remove(code: string): boolean;
  list(): RegionalApprovalSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalApprovalSlotStore implements RegionalApprovalSlotStore {
  items: Map<string, RegionalApprovalSlot>;
  order: string[];

  constructor(items: Map<string, RegionalApprovalSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalApprovalSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalApprovalSlot): void {
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

  list(): RegionalApprovalSlot[] {
    const out: RegionalApprovalSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalApprovalSlotStore(): RegionalApprovalSlotStore {
  return new MemoryRegionalApprovalSlotStore(new Map<string, RegionalApprovalSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalApprovalSlotStore implements RegionalApprovalSlotStore {
  inner: RegionalApprovalSlotStore;
  cache: cache.TtlCache<RegionalApprovalSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalApprovalSlotStore,
    cacheValue: cache.TtlCache<RegionalApprovalSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalApprovalSlot | undefined {
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

  save(item: RegionalApprovalSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalApprovalSlot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalApprovalSlotStore(inner: RegionalApprovalSlotStore, ttl: number, clockValue: clock.Clock): RegionalApprovalSlotStore {
  return new CachedRegionalApprovalSlotStore(
    inner,
    cache.newTtlCache<RegionalApprovalSlot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional approval slots. Empty fields match all. */
export class RegionalApprovalSlotQuery {
  unit: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMargin: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalApprovalSlot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalApprovalSlot[]): RegionalApprovalSlot[] {
    const matched = collections.filter(items, (candidate: RegionalApprovalSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalApprovalSlots(store: RegionalApprovalSlotStore, query: RegionalApprovalSlotQuery): RegionalApprovalSlot[] {
  return query.apply(store.list());
}
