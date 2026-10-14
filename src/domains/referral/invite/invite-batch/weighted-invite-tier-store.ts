import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedInviteTier } from "./weighted-invite-tier.js";

/** Keeps weighted invite tiers by code. */
export interface WeightedInviteTierStore {
  find(code: string): WeightedInviteTier | undefined;
  save(item: WeightedInviteTier): void;
  remove(code: string): boolean;
  list(): WeightedInviteTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedInviteTierStore implements WeightedInviteTierStore {
  items: Map<string, WeightedInviteTier>;
  order: string[];

  constructor(items: Map<string, WeightedInviteTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedInviteTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedInviteTier): void {
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

  list(): WeightedInviteTier[] {
    const out: WeightedInviteTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedInviteTierStore(): WeightedInviteTierStore {
  return new MemoryWeightedInviteTierStore(new Map<string, WeightedInviteTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedInviteTierStore implements WeightedInviteTierStore {
  inner: WeightedInviteTierStore;
  cache: cache.TtlCache<WeightedInviteTier>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedInviteTierStore,
    cacheValue: cache.TtlCache<WeightedInviteTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedInviteTier | undefined {
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

  save(item: WeightedInviteTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedInviteTier[] {
    return this.inner.list();
  }
}

export function newCachedWeightedInviteTierStore(inner: WeightedInviteTierStore, ttl: number, clockValue: clock.Clock): WeightedInviteTierStore {
  return new CachedWeightedInviteTierStore(inner, cache.newTtlCache<WeightedInviteTier>(512, ttl, clockValue), 0, 0);
}

/** Selects weighted invite tiers. Empty fields match all. */
export class WeightedInviteTierQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedInviteTier): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedInviteTier[]): WeightedInviteTier[] {
    const matched = collections.filter(items, (candidate: WeightedInviteTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedInviteTiers(store: WeightedInviteTierStore, query: WeightedInviteTierQuery): WeightedInviteTier[] {
  return query.apply(store.list());
}
