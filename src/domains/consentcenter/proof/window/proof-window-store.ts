import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofWindow } from "./proof-window.js";

/** Keeps proof windows by code. */
export interface ProofWindowStore {
  find(code: string): ProofWindow | undefined;
  save(item: ProofWindow): void;
  remove(code: string): boolean;
  list(): ProofWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofWindowStore implements ProofWindowStore {
  items: Map<string, ProofWindow>;
  order: string[];

  constructor(items: Map<string, ProofWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofWindow): void {
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

  list(): ProofWindow[] {
    const out: ProofWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofWindowStore(): ProofWindowStore {
  return new MemoryProofWindowStore(new Map<string, ProofWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofWindowStore implements ProofWindowStore {
  inner: ProofWindowStore;
  cache: cache.TtlCache<ProofWindow>;
  hits: number;
  misses: number;

  constructor(inner: ProofWindowStore, cacheValue: cache.TtlCache<ProofWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofWindow | undefined {
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

  save(item: ProofWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofWindow[] {
    return this.inner.list();
  }
}

export function newCachedProofWindowStore(inner: ProofWindowStore, ttl: number, clockValue: clock.Clock): ProofWindowStore {
  return new CachedProofWindowStore(inner, cache.newTtlCache<ProofWindow>(128, ttl, clockValue), 0, 0);
}

/** Selects proof windows. Empty fields match all. */
export class ProofWindowQuery {
  category: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCost: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofWindow[]): ProofWindow[] {
    const matched = collections.filter(items, (candidate: ProofWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofWindows(store: ProofWindowStore, query: ProofWindowQuery): ProofWindow[] {
  return query.apply(store.list());
}
