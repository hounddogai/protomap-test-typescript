import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultBidRulePlan } from "./default-bid-rule-plan.js";

/** Keeps default bid rule plans by code. */
export interface DefaultBidRulePlanStore {
  find(code: string): DefaultBidRulePlan | undefined;
  save(item: DefaultBidRulePlan): void;
  remove(code: string): boolean;
  list(): DefaultBidRulePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultBidRulePlanStore implements DefaultBidRulePlanStore {
  items: Map<string, DefaultBidRulePlan>;
  order: string[];

  constructor(items: Map<string, DefaultBidRulePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultBidRulePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultBidRulePlan): void {
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

  list(): DefaultBidRulePlan[] {
    const out: DefaultBidRulePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultBidRulePlanStore(): DefaultBidRulePlanStore {
  return new MemoryDefaultBidRulePlanStore(new Map<string, DefaultBidRulePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultBidRulePlanStore implements DefaultBidRulePlanStore {
  inner: DefaultBidRulePlanStore;
  cache: cache.TtlCache<DefaultBidRulePlan>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultBidRulePlanStore,
    cacheValue: cache.TtlCache<DefaultBidRulePlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultBidRulePlan | undefined {
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

  save(item: DefaultBidRulePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultBidRulePlan[] {
    return this.inner.list();
  }
}

export function newCachedDefaultBidRulePlanStore(inner: DefaultBidRulePlanStore, ttl: number, clockValue: clock.Clock): DefaultBidRulePlanStore {
  return new CachedDefaultBidRulePlanStore(inner, cache.newTtlCache<DefaultBidRulePlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects default bid rule plans. Empty fields match all. */
export class DefaultBidRulePlanQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultBidRulePlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultBidRulePlan[]): DefaultBidRulePlan[] {
    const matched = collections.filter(items, (candidate: DefaultBidRulePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultBidRulePlans(store: DefaultBidRulePlanStore, query: DefaultBidRulePlanQuery): DefaultBidRulePlan[] {
  return query.apply(store.list());
}
