import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelRule } from "./funnel-rule.js";

/** Keeps funnel rules by code. */
export interface FunnelRuleStore {
  find(code: string): FunnelRule | undefined;
  save(item: FunnelRule): void;
  remove(code: string): boolean;
  list(): FunnelRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelRuleStore implements FunnelRuleStore {
  items: Map<string, FunnelRule>;
  order: string[];

  constructor(items: Map<string, FunnelRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelRule): void {
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

  list(): FunnelRule[] {
    const out: FunnelRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelRuleStore(): FunnelRuleStore {
  return new MemoryFunnelRuleStore(new Map<string, FunnelRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelRuleStore implements FunnelRuleStore {
  inner: FunnelRuleStore;
  cache: cache.TtlCache<FunnelRule>;
  hits: number;
  misses: number;

  constructor(inner: FunnelRuleStore, cacheValue: cache.TtlCache<FunnelRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelRule | undefined {
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

  save(item: FunnelRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelRule[] {
    return this.inner.list();
  }
}

export function newCachedFunnelRuleStore(inner: FunnelRuleStore, ttl: number, clockValue: clock.Clock): FunnelRuleStore {
  return new CachedFunnelRuleStore(inner, cache.newTtlCache<FunnelRule>(256, ttl, clockValue), 0, 0);
}

/** Selects funnel rules. Empty fields match all. */
export class FunnelRuleQuery {
  source: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelRule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelRule[]): FunnelRule[] {
    const matched = collections.filter(items, (candidate: FunnelRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelRules(store: FunnelRuleStore, query: FunnelRuleQuery): FunnelRule[] {
  return query.apply(store.list());
}
