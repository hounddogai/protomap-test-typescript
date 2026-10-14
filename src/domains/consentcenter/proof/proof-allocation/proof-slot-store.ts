import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofSlot } from "./proof-slot.js";

/** Keeps proof slots by code. */
export interface ProofSlotStore {
  find(code: string): ProofSlot | undefined;
  save(item: ProofSlot): void;
  remove(code: string): boolean;
  list(): ProofSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofSlotStore implements ProofSlotStore {
  items: Map<string, ProofSlot>;
  order: string[];

  constructor(items: Map<string, ProofSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofSlot): void {
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

  list(): ProofSlot[] {
    const out: ProofSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofSlotStore(): ProofSlotStore {
  return new MemoryProofSlotStore(new Map<string, ProofSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofSlotStore implements ProofSlotStore {
  inner: ProofSlotStore;
  cache: cache.TtlCache<ProofSlot>;
  hits: number;
  misses: number;

  constructor(inner: ProofSlotStore, cacheValue: cache.TtlCache<ProofSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofSlot | undefined {
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

  save(item: ProofSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofSlot[] {
    return this.inner.list();
  }
}

export function newCachedProofSlotStore(inner: ProofSlotStore, ttl: number, clockValue: clock.Clock): ProofSlotStore {
  return new CachedProofSlotStore(inner, cache.newTtlCache<ProofSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects proof slots. Empty fields match all. */
export class ProofSlotQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofSlot[]): ProofSlot[] {
    const matched = collections.filter(items, (candidate: ProofSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofSlots(store: ProofSlotStore, query: ProofSlotQuery): ProofSlot[] {
  return query.apply(store.list());
}
