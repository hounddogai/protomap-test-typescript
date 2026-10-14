import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictMentionPlan } from "./strict-mention-plan.js";

/** Keeps strict mention plans by code. */
export interface StrictMentionPlanStore {
  find(code: string): StrictMentionPlan | undefined;
  save(item: StrictMentionPlan): void;
  remove(code: string): boolean;
  list(): StrictMentionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictMentionPlanStore implements StrictMentionPlanStore {
  items: Map<string, StrictMentionPlan>;
  order: string[];

  constructor(items: Map<string, StrictMentionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictMentionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictMentionPlan): void {
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

  list(): StrictMentionPlan[] {
    const out: StrictMentionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictMentionPlanStore(): StrictMentionPlanStore {
  return new MemoryStrictMentionPlanStore(new Map<string, StrictMentionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictMentionPlanStore implements StrictMentionPlanStore {
  inner: StrictMentionPlanStore;
  cache: cache.TtlCache<StrictMentionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictMentionPlanStore,
    cacheValue: cache.TtlCache<StrictMentionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictMentionPlan | undefined {
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

  save(item: StrictMentionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictMentionPlan[] {
    return this.inner.list();
  }
}

export function newCachedStrictMentionPlanStore(inner: StrictMentionPlanStore, ttl: number, clockValue: clock.Clock): StrictMentionPlanStore {
  return new CachedStrictMentionPlanStore(inner, cache.newTtlCache<StrictMentionPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects strict mention plans. Empty fields match all. */
export class StrictMentionPlanQuery {
  region: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minScore: number, statuses: string[], limit: number) {
    this.region = region;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictMentionPlan): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictMentionPlan[]): StrictMentionPlan[] {
    const matched = collections.filter(items, (candidate: StrictMentionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictMentionPlans(store: StrictMentionPlanStore, query: StrictMentionPlanQuery): StrictMentionPlan[] {
  return query.apply(store.list());
}
