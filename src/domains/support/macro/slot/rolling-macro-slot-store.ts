import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingMacroSlot } from "./rolling-macro-slot.js";

/** Keeps rolling macro slots by code. */
export interface RollingMacroSlotStore {
  find(code: string): RollingMacroSlot | undefined;
  save(item: RollingMacroSlot): void;
  remove(code: string): boolean;
  list(): RollingMacroSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingMacroSlotStore implements RollingMacroSlotStore {
  items: Map<string, RollingMacroSlot>;
  order: string[];

  constructor(items: Map<string, RollingMacroSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingMacroSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingMacroSlot): void {
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

  list(): RollingMacroSlot[] {
    const out: RollingMacroSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingMacroSlotStore(): RollingMacroSlotStore {
  return new MemoryRollingMacroSlotStore(new Map<string, RollingMacroSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingMacroSlotStore implements RollingMacroSlotStore {
  inner: RollingMacroSlotStore;
  cache: cache.TtlCache<RollingMacroSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingMacroSlotStore,
    cacheValue: cache.TtlCache<RollingMacroSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingMacroSlot | undefined {
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

  save(item: RollingMacroSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingMacroSlot[] {
    return this.inner.list();
  }
}

export function newCachedRollingMacroSlotStore(inner: RollingMacroSlotStore, ttl: number, clockValue: clock.Clock): RollingMacroSlotStore {
  return new CachedRollingMacroSlotStore(inner, cache.newTtlCache<RollingMacroSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling macro slots. Empty fields match all. */
export class RollingMacroSlotQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingMacroSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingMacroSlot[]): RollingMacroSlot[] {
    const matched = collections.filter(items, (candidate: RollingMacroSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingMacroSlots(store: RollingMacroSlotStore, query: RollingMacroSlotQuery): RollingMacroSlot[] {
  return query.apply(store.list());
}
