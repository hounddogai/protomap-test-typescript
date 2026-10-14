import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalJourneyPlan } from "./regional-journey-plan.js";

/** Keeps regional journey plans by code. */
export interface RegionalJourneyPlanStore {
  find(code: string): RegionalJourneyPlan | undefined;
  save(item: RegionalJourneyPlan): void;
  remove(code: string): boolean;
  list(): RegionalJourneyPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalJourneyPlanStore implements RegionalJourneyPlanStore {
  items: Map<string, RegionalJourneyPlan>;
  order: string[];

  constructor(items: Map<string, RegionalJourneyPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalJourneyPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalJourneyPlan): void {
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

  list(): RegionalJourneyPlan[] {
    const out: RegionalJourneyPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalJourneyPlanStore(): RegionalJourneyPlanStore {
  return new MemoryRegionalJourneyPlanStore(new Map<string, RegionalJourneyPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalJourneyPlanStore implements RegionalJourneyPlanStore {
  inner: RegionalJourneyPlanStore;
  cache: cache.TtlCache<RegionalJourneyPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalJourneyPlanStore,
    cacheValue: cache.TtlCache<RegionalJourneyPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalJourneyPlan | undefined {
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

  save(item: RegionalJourneyPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalJourneyPlan[] {
    return this.inner.list();
  }
}

export function newCachedRegionalJourneyPlanStore(inner: RegionalJourneyPlanStore, ttl: number, clockValue: clock.Clock): RegionalJourneyPlanStore {
  return new CachedRegionalJourneyPlanStore(inner, cache.newTtlCache<RegionalJourneyPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional journey plans. Empty fields match all. */
export class RegionalJourneyPlanQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalJourneyPlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalJourneyPlan[]): RegionalJourneyPlan[] {
    const matched = collections.filter(items, (candidate: RegionalJourneyPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalJourneyPlans(store: RegionalJourneyPlanStore, query: RegionalJourneyPlanQuery): RegionalJourneyPlan[] {
  return query.apply(store.list());
}
