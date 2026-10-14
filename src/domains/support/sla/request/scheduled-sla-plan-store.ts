import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSlaPlan } from "./scheduled-sla-plan.js";

/** Keeps scheduled sla plans by code. */
export interface ScheduledSlaPlanStore {
  find(code: string): ScheduledSlaPlan | undefined;
  save(item: ScheduledSlaPlan): void;
  remove(code: string): boolean;
  list(): ScheduledSlaPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSlaPlanStore implements ScheduledSlaPlanStore {
  items: Map<string, ScheduledSlaPlan>;
  order: string[];

  constructor(items: Map<string, ScheduledSlaPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSlaPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSlaPlan): void {
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

  list(): ScheduledSlaPlan[] {
    const out: ScheduledSlaPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSlaPlanStore(): ScheduledSlaPlanStore {
  return new MemoryScheduledSlaPlanStore(new Map<string, ScheduledSlaPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSlaPlanStore implements ScheduledSlaPlanStore {
  inner: ScheduledSlaPlanStore;
  cache: cache.TtlCache<ScheduledSlaPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSlaPlanStore,
    cacheValue: cache.TtlCache<ScheduledSlaPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSlaPlan | undefined {
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

  save(item: ScheduledSlaPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSlaPlan[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSlaPlanStore(inner: ScheduledSlaPlanStore, ttl: number, clockValue: clock.Clock): ScheduledSlaPlanStore {
  return new CachedScheduledSlaPlanStore(inner, cache.newTtlCache<ScheduledSlaPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects scheduled sla plans. Empty fields match all. */
export class ScheduledSlaPlanQuery {
  segment: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minOpenRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSlaPlan): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSlaPlan[]): ScheduledSlaPlan[] {
    const matched = collections.filter(items, (candidate: ScheduledSlaPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSlaPlans(store: ScheduledSlaPlanStore, query: ScheduledSlaPlanQuery): ScheduledSlaPlan[] {
  return query.apply(store.list());
}
