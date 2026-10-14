import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewPlan } from "./ticket-view-plan.js";

/** Keeps ticket view plans by code. */
export interface TicketViewPlanStore {
  find(code: string): TicketViewPlan | undefined;
  save(item: TicketViewPlan): void;
  remove(code: string): boolean;
  list(): TicketViewPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewPlanStore implements TicketViewPlanStore {
  items: Map<string, TicketViewPlan>;
  order: string[];

  constructor(items: Map<string, TicketViewPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewPlan): void {
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

  list(): TicketViewPlan[] {
    const out: TicketViewPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewPlanStore(): TicketViewPlanStore {
  return new MemoryTicketViewPlanStore(new Map<string, TicketViewPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewPlanStore implements TicketViewPlanStore {
  inner: TicketViewPlanStore;
  cache: cache.TtlCache<TicketViewPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewPlanStore,
    cacheValue: cache.TtlCache<TicketViewPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewPlan | undefined {
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

  save(item: TicketViewPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewPlan[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewPlanStore(inner: TicketViewPlanStore, ttl: number, clockValue: clock.Clock): TicketViewPlanStore {
  return new CachedTicketViewPlanStore(inner, cache.newTtlCache<TicketViewPlan>(256, ttl, clockValue), 0, 0);
}

/** Selects ticket view plans. Empty fields match all. */
export class TicketViewPlanQuery {
  region: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minConversionRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewPlan): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewPlan[]): TicketViewPlan[] {
    const matched = collections.filter(items, (candidate: TicketViewPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewPlans(store: TicketViewPlanStore, query: TicketViewPlanQuery): TicketViewPlan[] {
  return query.apply(store.list());
}
