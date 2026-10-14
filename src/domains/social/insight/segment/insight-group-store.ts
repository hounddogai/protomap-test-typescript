import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightGroup } from "./insight-group.js";

/** Keeps insight groups by code. */
export interface InsightGroupStore {
  find(code: string): InsightGroup | undefined;
  save(item: InsightGroup): void;
  remove(code: string): boolean;
  list(): InsightGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightGroupStore implements InsightGroupStore {
  items: Map<string, InsightGroup>;
  order: string[];

  constructor(items: Map<string, InsightGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightGroup): void {
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

  list(): InsightGroup[] {
    const out: InsightGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightGroupStore(): InsightGroupStore {
  return new MemoryInsightGroupStore(new Map<string, InsightGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightGroupStore implements InsightGroupStore {
  inner: InsightGroupStore;
  cache: cache.TtlCache<InsightGroup>;
  hits: number;
  misses: number;

  constructor(inner: InsightGroupStore, cacheValue: cache.TtlCache<InsightGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightGroup | undefined {
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

  save(item: InsightGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightGroup[] {
    return this.inner.list();
  }
}

export function newCachedInsightGroupStore(inner: InsightGroupStore, ttl: number, clockValue: clock.Clock): InsightGroupStore {
  return new CachedInsightGroupStore(inner, cache.newTtlCache<InsightGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects insight groups. Empty fields match all. */
export class InsightGroupQuery {
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

  matches(item: InsightGroup): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightGroup[]): InsightGroup[] {
    const matched = collections.filter(items, (candidate: InsightGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightGroups(store: InsightGroupStore, query: InsightGroupQuery): InsightGroup[] {
  return query.apply(store.list());
}
