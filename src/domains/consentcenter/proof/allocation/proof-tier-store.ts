import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofTier } from "./proof-tier.js";

/** Keeps proof tiers by code. */
export interface ProofTierStore {
  find(code: string): ProofTier | undefined;
  save(item: ProofTier): void;
  remove(code: string): boolean;
  list(): ProofTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofTierStore implements ProofTierStore {
  items: Map<string, ProofTier>;
  order: string[];

  constructor(items: Map<string, ProofTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofTier): void {
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

  list(): ProofTier[] {
    const out: ProofTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofTierStore(): ProofTierStore {
  return new MemoryProofTierStore(new Map<string, ProofTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofTierStore implements ProofTierStore {
  inner: ProofTierStore;
  cache: cache.TtlCache<ProofTier>;
  hits: number;
  misses: number;

  constructor(inner: ProofTierStore, cacheValue: cache.TtlCache<ProofTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofTier | undefined {
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

  save(item: ProofTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofTier[] {
    return this.inner.list();
  }
}

export function newCachedProofTierStore(inner: ProofTierStore, ttl: number, clockValue: clock.Clock): ProofTierStore {
  return new CachedProofTierStore(inner, cache.newTtlCache<ProofTier>(512, ttl, clockValue), 0, 0);
}

/** Selects proof tiers. Empty fields match all. */
export class ProofTierQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofTier[]): ProofTier[] {
    const matched = collections.filter(items, (candidate: ProofTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofTiers(store: ProofTierStore, query: ProofTierQuery): ProofTier[] {
  return query.apply(store.list());
}
