import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakRule } from "./streak-rule.js";

/** Keeps streak rules by code. */
export interface StreakRuleStore {
  find(code: string): StreakRule | undefined;
  save(item: StreakRule): void;
  remove(code: string): boolean;
  list(): StreakRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakRuleStore implements StreakRuleStore {
  items: Map<string, StreakRule>;
  order: string[];

  constructor(items: Map<string, StreakRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakRule): void {
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

  list(): StreakRule[] {
    const out: StreakRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakRuleStore(): StreakRuleStore {
  return new MemoryStreakRuleStore(new Map<string, StreakRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakRuleStore implements StreakRuleStore {
  inner: StreakRuleStore;
  cache: cache.TtlCache<StreakRule>;
  hits: number;
  misses: number;

  constructor(inner: StreakRuleStore, cacheValue: cache.TtlCache<StreakRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakRule | undefined {
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

  save(item: StreakRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakRule[] {
    return this.inner.list();
  }
}

export function newCachedStreakRuleStore(inner: StreakRuleStore, ttl: number, clockValue: clock.Clock): StreakRuleStore {
  return new CachedStreakRuleStore(inner, cache.newTtlCache<StreakRule>(256, ttl, clockValue), 0, 0);
}

/** Selects streak rules. Empty fields match all. */
export class StreakRuleQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakRule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakRule[]): StreakRule[] {
    const matched = collections.filter(items, (candidate: StreakRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakRules(store: StreakRuleStore, query: StreakRuleQuery): StreakRule[] {
  return query.apply(store.list());
}
