import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightTarget } from "./insight-target.js";

/** Keeps insight targets by code. */
export interface InsightTargetStore {
  find(code: string): InsightTarget | undefined;
  save(item: InsightTarget): void;
  remove(code: string): boolean;
  list(): InsightTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightTargetStore implements InsightTargetStore {
  items: Map<string, InsightTarget>;
  order: string[];

  constructor(items: Map<string, InsightTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightTarget): void {
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

  list(): InsightTarget[] {
    const out: InsightTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightTargetStore(): InsightTargetStore {
  return new MemoryInsightTargetStore(new Map<string, InsightTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightTargetStore implements InsightTargetStore {
  inner: InsightTargetStore;
  cache: cache.TtlCache<InsightTarget>;
  hits: number;
  misses: number;

  constructor(inner: InsightTargetStore, cacheValue: cache.TtlCache<InsightTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightTarget | undefined {
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

  save(item: InsightTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightTarget[] {
    return this.inner.list();
  }
}

export function newCachedInsightTargetStore(inner: InsightTargetStore, ttl: number, clockValue: clock.Clock): InsightTargetStore {
  return new CachedInsightTargetStore(inner, cache.newTtlCache<InsightTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects insight targets. Empty fields match all. */
export class InsightTargetQuery {
  segment: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMaximum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightTarget): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightTarget[]): InsightTarget[] {
    const matched = collections.filter(items, (candidate: InsightTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightTargets(store: InsightTargetStore, query: InsightTargetQuery): InsightTarget[] {
  return query.apply(store.list());
}
