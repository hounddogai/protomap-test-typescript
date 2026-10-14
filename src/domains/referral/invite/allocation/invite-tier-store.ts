import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteTier } from "./invite-tier.js";

/** Keeps invite tiers by code. */
export interface InviteTierStore {
  find(code: string): InviteTier | undefined;
  save(item: InviteTier): void;
  remove(code: string): boolean;
  list(): InviteTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteTierStore implements InviteTierStore {
  items: Map<string, InviteTier>;
  order: string[];

  constructor(items: Map<string, InviteTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteTier): void {
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

  list(): InviteTier[] {
    const out: InviteTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteTierStore(): InviteTierStore {
  return new MemoryInviteTierStore(new Map<string, InviteTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteTierStore implements InviteTierStore {
  inner: InviteTierStore;
  cache: cache.TtlCache<InviteTier>;
  hits: number;
  misses: number;

  constructor(inner: InviteTierStore, cacheValue: cache.TtlCache<InviteTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteTier | undefined {
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

  save(item: InviteTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteTier[] {
    return this.inner.list();
  }
}

export function newCachedInviteTierStore(inner: InviteTierStore, ttl: number, clockValue: clock.Clock): InviteTierStore {
  return new CachedInviteTierStore(inner, cache.newTtlCache<InviteTier>(128, ttl, clockValue), 0, 0);
}

/** Selects invite tiers. Empty fields match all. */
export class InviteTierQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteTier): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteTier[]): InviteTier[] {
    const matched = collections.filter(items, (candidate: InviteTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteTiers(store: InviteTierStore, query: InviteTierQuery): InviteTier[] {
  return query.apply(store.list());
}
