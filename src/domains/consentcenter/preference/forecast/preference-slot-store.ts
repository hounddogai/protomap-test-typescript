import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceSlot } from "./preference-slot.js";

/** Keeps preference slots by code. */
export interface PreferenceSlotStore {
  find(code: string): PreferenceSlot | undefined;
  save(item: PreferenceSlot): void;
  remove(code: string): boolean;
  list(): PreferenceSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceSlotStore implements PreferenceSlotStore {
  items: Map<string, PreferenceSlot>;
  order: string[];

  constructor(items: Map<string, PreferenceSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceSlot): void {
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

  list(): PreferenceSlot[] {
    const out: PreferenceSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceSlotStore(): PreferenceSlotStore {
  return new MemoryPreferenceSlotStore(new Map<string, PreferenceSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceSlotStore implements PreferenceSlotStore {
  inner: PreferenceSlotStore;
  cache: cache.TtlCache<PreferenceSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceSlotStore,
    cacheValue: cache.TtlCache<PreferenceSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceSlot | undefined {
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

  save(item: PreferenceSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceSlot[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceSlotStore(inner: PreferenceSlotStore, ttl: number, clockValue: clock.Clock): PreferenceSlotStore {
  return new CachedPreferenceSlotStore(inner, cache.newTtlCache<PreferenceSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects preference slots. Empty fields match all. */
export class PreferenceSlotQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceSlot[]): PreferenceSlot[] {
    const matched = collections.filter(items, (candidate: PreferenceSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceSlots(store: PreferenceSlotStore, query: PreferenceSlotQuery): PreferenceSlot[] {
  return query.apply(store.list());
}
