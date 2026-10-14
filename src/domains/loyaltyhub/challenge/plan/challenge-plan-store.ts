import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengePlan } from "./challenge-plan.js";

/** Keeps challenge plans by code. */
export interface ChallengePlanStore {
  find(code: string): ChallengePlan | undefined;
  save(item: ChallengePlan): void;
  remove(code: string): boolean;
  list(): ChallengePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengePlanStore implements ChallengePlanStore {
  items: Map<string, ChallengePlan>;
  order: string[];

  constructor(items: Map<string, ChallengePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengePlan): void {
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

  list(): ChallengePlan[] {
    const out: ChallengePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengePlanStore(): ChallengePlanStore {
  return new MemoryChallengePlanStore(new Map<string, ChallengePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengePlanStore implements ChallengePlanStore {
  inner: ChallengePlanStore;
  cache: cache.TtlCache<ChallengePlan>;
  hits: number;
  misses: number;

  constructor(inner: ChallengePlanStore, cacheValue: cache.TtlCache<ChallengePlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengePlan | undefined {
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

  save(item: ChallengePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengePlan[] {
    return this.inner.list();
  }
}

export function newCachedChallengePlanStore(inner: ChallengePlanStore, ttl: number, clockValue: clock.Clock): ChallengePlanStore {
  return new CachedChallengePlanStore(inner, cache.newTtlCache<ChallengePlan>(128, ttl, clockValue), 0, 0);
}

/** Selects challenge plans. Empty fields match all. */
export class ChallengePlanQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengePlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengePlan[]): ChallengePlan[] {
    const matched = collections.filter(items, (candidate: ChallengePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengePlans(store: ChallengePlanStore, query: ChallengePlanQuery): ChallengePlan[] {
  return query.apply(store.list());
}
