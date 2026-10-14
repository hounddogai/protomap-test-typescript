import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofPlan } from "./proof-plan.js";

/** Keeps proof plans by code. */
export interface ProofPlanStore {
  find(code: string): ProofPlan | undefined;
  save(item: ProofPlan): void;
  remove(code: string): boolean;
  list(): ProofPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofPlanStore implements ProofPlanStore {
  items: Map<string, ProofPlan>;
  order: string[];

  constructor(items: Map<string, ProofPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofPlan): void {
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

  list(): ProofPlan[] {
    const out: ProofPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofPlanStore(): ProofPlanStore {
  return new MemoryProofPlanStore(new Map<string, ProofPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofPlanStore implements ProofPlanStore {
  inner: ProofPlanStore;
  cache: cache.TtlCache<ProofPlan>;
  hits: number;
  misses: number;

  constructor(inner: ProofPlanStore, cacheValue: cache.TtlCache<ProofPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofPlan | undefined {
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

  save(item: ProofPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofPlan[] {
    return this.inner.list();
  }
}

export function newCachedProofPlanStore(inner: ProofPlanStore, ttl: number, clockValue: clock.Clock): ProofPlanStore {
  return new CachedProofPlanStore(inner, cache.newTtlCache<ProofPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects proof plans. Empty fields match all. */
export class ProofPlanQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofPlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofPlan[]): ProofPlan[] {
    const matched = collections.filter(items, (candidate: ProofPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofPlans(store: ProofPlanStore, query: ProofPlanQuery): ProofPlan[] {
  return query.apply(store.list());
}
