import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardTemplate } from "./weighted-reward-template.js";

/** Keeps weighted reward templates by code. */
export interface WeightedRewardTemplateStore {
  find(code: string): WeightedRewardTemplate | undefined;
  save(item: WeightedRewardTemplate): void;
  remove(code: string): boolean;
  list(): WeightedRewardTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardTemplateStore implements WeightedRewardTemplateStore {
  items: Map<string, WeightedRewardTemplate>;
  order: string[];

  constructor(items: Map<string, WeightedRewardTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardTemplate): void {
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

  list(): WeightedRewardTemplate[] {
    const out: WeightedRewardTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardTemplateStore(): WeightedRewardTemplateStore {
  return new MemoryWeightedRewardTemplateStore(new Map<string, WeightedRewardTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardTemplateStore implements WeightedRewardTemplateStore {
  inner: WeightedRewardTemplateStore;
  cache: cache.TtlCache<WeightedRewardTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardTemplateStore,
    cacheValue: cache.TtlCache<WeightedRewardTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardTemplate | undefined {
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

  save(item: WeightedRewardTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardTemplate[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardTemplateStore(inner: WeightedRewardTemplateStore, ttl: number, clockValue: clock.Clock): WeightedRewardTemplateStore {
  return new CachedWeightedRewardTemplateStore(
    inner,
    cache.newTtlCache<WeightedRewardTemplate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward templates. Empty fields match all. */
export class WeightedRewardTemplateQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardTemplate[]): WeightedRewardTemplate[] {
    const matched = collections.filter(items, (candidate: WeightedRewardTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardTemplates(store: WeightedRewardTemplateStore, query: WeightedRewardTemplateQuery): WeightedRewardTemplate[] {
  return query.apply(store.list());
}
