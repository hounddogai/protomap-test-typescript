import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionPlan } from "./mention-plan.js";

/** Keeps mention plans by code. */
export interface MentionPlanStore {
  find(code: string): MentionPlan | undefined;
  save(item: MentionPlan): void;
  remove(code: string): boolean;
  list(): MentionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionPlanStore implements MentionPlanStore {
  items: Map<string, MentionPlan>;
  order: string[];

  constructor(items: Map<string, MentionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionPlan): void {
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

  list(): MentionPlan[] {
    const out: MentionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionPlanStore(): MentionPlanStore {
  return new MemoryMentionPlanStore(new Map<string, MentionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionPlanStore implements MentionPlanStore {
  inner: MentionPlanStore;
  cache: cache.TtlCache<MentionPlan>;
  hits: number;
  misses: number;

  constructor(inner: MentionPlanStore, cacheValue: cache.TtlCache<MentionPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionPlan | undefined {
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

  save(item: MentionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionPlan[] {
    return this.inner.list();
  }
}

export function newCachedMentionPlanStore(inner: MentionPlanStore, ttl: number, clockValue: clock.Clock): MentionPlanStore {
  return new CachedMentionPlanStore(inner, cache.newTtlCache<MentionPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects mention plans. Empty fields match all. */
export class MentionPlanQuery {
  source: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDiscount: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionPlan): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionPlan[]): MentionPlan[] {
    const matched = collections.filter(items, (candidate: MentionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionPlans(store: MentionPlanStore, query: MentionPlanQuery): MentionPlan[] {
  return query.apply(store.list());
}
