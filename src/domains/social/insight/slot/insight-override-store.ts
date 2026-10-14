import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightOverride } from "./insight-override.js";

/** Keeps insight overrides by code. */
export interface InsightOverrideStore {
  find(code: string): InsightOverride | undefined;
  save(item: InsightOverride): void;
  remove(code: string): boolean;
  list(): InsightOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightOverrideStore implements InsightOverrideStore {
  items: Map<string, InsightOverride>;
  order: string[];

  constructor(items: Map<string, InsightOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightOverride): void {
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

  list(): InsightOverride[] {
    const out: InsightOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightOverrideStore(): InsightOverrideStore {
  return new MemoryInsightOverrideStore(new Map<string, InsightOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightOverrideStore implements InsightOverrideStore {
  inner: InsightOverrideStore;
  cache: cache.TtlCache<InsightOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightOverrideStore,
    cacheValue: cache.TtlCache<InsightOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightOverride | undefined {
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

  save(item: InsightOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightOverride[] {
    return this.inner.list();
  }
}

export function newCachedInsightOverrideStore(inner: InsightOverrideStore, ttl: number, clockValue: clock.Clock): InsightOverrideStore {
  return new CachedInsightOverrideStore(inner, cache.newTtlCache<InsightOverride>(1024, ttl, clockValue), 0, 0);
}

/** Selects insight overrides. Empty fields match all. */
export class InsightOverrideQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightOverride): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightOverride[]): InsightOverride[] {
    const matched = collections.filter(items, (candidate: InsightOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightOverrides(store: InsightOverrideStore, query: InsightOverrideQuery): InsightOverride[] {
  return query.apply(store.list());
}
