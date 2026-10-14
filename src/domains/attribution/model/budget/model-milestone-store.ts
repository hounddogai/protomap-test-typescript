import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelMilestone } from "./model-milestone.js";

/** Keeps model milestones by code. */
export interface ModelMilestoneStore {
  find(code: string): ModelMilestone | undefined;
  save(item: ModelMilestone): void;
  remove(code: string): boolean;
  list(): ModelMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelMilestoneStore implements ModelMilestoneStore {
  items: Map<string, ModelMilestone>;
  order: string[];

  constructor(items: Map<string, ModelMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelMilestone): void {
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

  list(): ModelMilestone[] {
    const out: ModelMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelMilestoneStore(): ModelMilestoneStore {
  return new MemoryModelMilestoneStore(new Map<string, ModelMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelMilestoneStore implements ModelMilestoneStore {
  inner: ModelMilestoneStore;
  cache: cache.TtlCache<ModelMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ModelMilestoneStore,
    cacheValue: cache.TtlCache<ModelMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelMilestone | undefined {
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

  save(item: ModelMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelMilestone[] {
    return this.inner.list();
  }
}

export function newCachedModelMilestoneStore(inner: ModelMilestoneStore, ttl: number, clockValue: clock.Clock): ModelMilestoneStore {
  return new CachedModelMilestoneStore(inner, cache.newTtlCache<ModelMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects model milestones. Empty fields match all. */
export class ModelMilestoneQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelMilestone): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelMilestone[]): ModelMilestone[] {
    const matched = collections.filter(items, (candidate: ModelMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelMilestones(store: ModelMilestoneStore, query: ModelMilestoneQuery): ModelMilestone[] {
  return query.apply(store.list());
}
