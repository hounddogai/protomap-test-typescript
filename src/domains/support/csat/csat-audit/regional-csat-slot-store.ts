import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCsatSlot } from "./regional-csat-slot.js";

/** Keeps regional csat slots by code. */
export interface RegionalCsatSlotStore {
  find(code: string): RegionalCsatSlot | undefined;
  save(item: RegionalCsatSlot): void;
  remove(code: string): boolean;
  list(): RegionalCsatSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCsatSlotStore implements RegionalCsatSlotStore {
  items: Map<string, RegionalCsatSlot>;
  order: string[];

  constructor(items: Map<string, RegionalCsatSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCsatSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCsatSlot): void {
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

  list(): RegionalCsatSlot[] {
    const out: RegionalCsatSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCsatSlotStore(): RegionalCsatSlotStore {
  return new MemoryRegionalCsatSlotStore(new Map<string, RegionalCsatSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCsatSlotStore implements RegionalCsatSlotStore {
  inner: RegionalCsatSlotStore;
  cache: cache.TtlCache<RegionalCsatSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCsatSlotStore,
    cacheValue: cache.TtlCache<RegionalCsatSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCsatSlot | undefined {
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

  save(item: RegionalCsatSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCsatSlot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCsatSlotStore(inner: RegionalCsatSlotStore, ttl: number, clockValue: clock.Clock): RegionalCsatSlotStore {
  return new CachedRegionalCsatSlotStore(inner, cache.newTtlCache<RegionalCsatSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional csat slots. Empty fields match all. */
export class RegionalCsatSlotQuery {
  channel: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRevision: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCsatSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCsatSlot[]): RegionalCsatSlot[] {
    const matched = collections.filter(items, (candidate: RegionalCsatSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCsatSlots(store: RegionalCsatSlotStore, query: RegionalCsatSlotQuery): RegionalCsatSlot[] {
  return query.apply(store.list());
}
