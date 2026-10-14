import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryDomainPlan } from "./primary-domain-plan.js";

/** Keeps primary domain plans by code. */
export interface PrimaryDomainPlanStore {
  find(code: string): PrimaryDomainPlan | undefined;
  save(item: PrimaryDomainPlan): void;
  remove(code: string): boolean;
  list(): PrimaryDomainPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryDomainPlanStore implements PrimaryDomainPlanStore {
  items: Map<string, PrimaryDomainPlan>;
  order: string[];

  constructor(items: Map<string, PrimaryDomainPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryDomainPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryDomainPlan): void {
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

  list(): PrimaryDomainPlan[] {
    const out: PrimaryDomainPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryDomainPlanStore(): PrimaryDomainPlanStore {
  return new MemoryPrimaryDomainPlanStore(new Map<string, PrimaryDomainPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryDomainPlanStore implements PrimaryDomainPlanStore {
  inner: PrimaryDomainPlanStore;
  cache: cache.TtlCache<PrimaryDomainPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryDomainPlanStore,
    cacheValue: cache.TtlCache<PrimaryDomainPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryDomainPlan | undefined {
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

  save(item: PrimaryDomainPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryDomainPlan[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryDomainPlanStore(inner: PrimaryDomainPlanStore, ttl: number, clockValue: clock.Clock): PrimaryDomainPlanStore {
  return new CachedPrimaryDomainPlanStore(inner, cache.newTtlCache<PrimaryDomainPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary domain plans. Empty fields match all. */
export class PrimaryDomainPlanQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryDomainPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryDomainPlan[]): PrimaryDomainPlan[] {
    const matched = collections.filter(items, (candidate: PrimaryDomainPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryDomainPlans(store: PrimaryDomainPlanStore, query: PrimaryDomainPlanQuery): PrimaryDomainPlan[] {
  return query.apply(store.list());
}
