import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderPlan } from "./sender-plan.js";

/** Keeps sender plans by code. */
export interface SenderPlanStore {
  find(code: string): SenderPlan | undefined;
  save(item: SenderPlan): void;
  remove(code: string): boolean;
  list(): SenderPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderPlanStore implements SenderPlanStore {
  items: Map<string, SenderPlan>;
  order: string[];

  constructor(items: Map<string, SenderPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderPlan): void {
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

  list(): SenderPlan[] {
    const out: SenderPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderPlanStore(): SenderPlanStore {
  return new MemorySenderPlanStore(new Map<string, SenderPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderPlanStore implements SenderPlanStore {
  inner: SenderPlanStore;
  cache: cache.TtlCache<SenderPlan>;
  hits: number;
  misses: number;

  constructor(inner: SenderPlanStore, cacheValue: cache.TtlCache<SenderPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderPlan | undefined {
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

  save(item: SenderPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderPlan[] {
    return this.inner.list();
  }
}

export function newCachedSenderPlanStore(inner: SenderPlanStore, ttl: number, clockValue: clock.Clock): SenderPlanStore {
  return new CachedSenderPlanStore(inner, cache.newTtlCache<SenderPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects sender plans. Empty fields match all. */
export class SenderPlanQuery {
  source: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMaximum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderPlan): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderPlan[]): SenderPlan[] {
    const matched = collections.filter(items, (candidate: SenderPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderPlans(store: SenderPlanStore, query: SenderPlanQuery): SenderPlan[] {
  return query.apply(store.list());
}
