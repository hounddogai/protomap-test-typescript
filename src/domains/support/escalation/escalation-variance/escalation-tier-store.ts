import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationTier } from "./escalation-tier.js";

/** Keeps escalation tiers by code. */
export interface EscalationTierStore {
  find(code: string): EscalationTier | undefined;
  save(item: EscalationTier): void;
  remove(code: string): boolean;
  list(): EscalationTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationTierStore implements EscalationTierStore {
  items: Map<string, EscalationTier>;
  order: string[];

  constructor(items: Map<string, EscalationTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationTier): void {
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

  list(): EscalationTier[] {
    const out: EscalationTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationTierStore(): EscalationTierStore {
  return new MemoryEscalationTierStore(new Map<string, EscalationTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationTierStore implements EscalationTierStore {
  inner: EscalationTierStore;
  cache: cache.TtlCache<EscalationTier>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationTierStore,
    cacheValue: cache.TtlCache<EscalationTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationTier | undefined {
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

  save(item: EscalationTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationTier[] {
    return this.inner.list();
  }
}

export function newCachedEscalationTierStore(inner: EscalationTierStore, ttl: number, clockValue: clock.Clock): EscalationTierStore {
  return new CachedEscalationTierStore(inner, cache.newTtlCache<EscalationTier>(128, ttl, clockValue), 0, 0);
}

/** Selects escalation tiers. Empty fields match all. */
export class EscalationTierQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationTier): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationTier[]): EscalationTier[] {
    const matched = collections.filter(items, (candidate: EscalationTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationTiers(store: EscalationTierStore, query: EscalationTierQuery): EscalationTier[] {
  return query.apply(store.list());
}
