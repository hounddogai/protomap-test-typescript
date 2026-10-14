import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainPlan } from "./domain-plan.js";

/** Keeps domain plans by code. */
export interface DomainPlanStore {
  find(code: string): DomainPlan | undefined;
  save(item: DomainPlan): void;
  remove(code: string): boolean;
  list(): DomainPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainPlanStore implements DomainPlanStore {
  items: Map<string, DomainPlan>;
  order: string[];

  constructor(items: Map<string, DomainPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainPlan): void {
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

  list(): DomainPlan[] {
    const out: DomainPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainPlanStore(): DomainPlanStore {
  return new MemoryDomainPlanStore(new Map<string, DomainPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainPlanStore implements DomainPlanStore {
  inner: DomainPlanStore;
  cache: cache.TtlCache<DomainPlan>;
  hits: number;
  misses: number;

  constructor(inner: DomainPlanStore, cacheValue: cache.TtlCache<DomainPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainPlan | undefined {
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

  save(item: DomainPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainPlan[] {
    return this.inner.list();
  }
}

export function newCachedDomainPlanStore(inner: DomainPlanStore, ttl: number, clockValue: clock.Clock): DomainPlanStore {
  return new CachedDomainPlanStore(inner, cache.newTtlCache<DomainPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects domain plans. Empty fields match all. */
export class DomainPlanQuery {
  source: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainPlan): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainPlan[]): DomainPlan[] {
    const matched = collections.filter(items, (candidate: DomainPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainPlans(store: DomainPlanStore, query: DomainPlanQuery): DomainPlan[] {
  return query.apply(store.list());
}
