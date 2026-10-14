import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationRule } from "./reputation-rule.js";

/** Keeps reputation rules by code. */
export interface ReputationRuleStore {
  find(code: string): ReputationRule | undefined;
  save(item: ReputationRule): void;
  remove(code: string): boolean;
  list(): ReputationRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationRuleStore implements ReputationRuleStore {
  items: Map<string, ReputationRule>;
  order: string[];

  constructor(items: Map<string, ReputationRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationRule): void {
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

  list(): ReputationRule[] {
    const out: ReputationRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationRuleStore(): ReputationRuleStore {
  return new MemoryReputationRuleStore(new Map<string, ReputationRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationRuleStore implements ReputationRuleStore {
  inner: ReputationRuleStore;
  cache: cache.TtlCache<ReputationRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationRuleStore,
    cacheValue: cache.TtlCache<ReputationRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationRule | undefined {
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

  save(item: ReputationRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationRule[] {
    return this.inner.list();
  }
}

export function newCachedReputationRuleStore(inner: ReputationRuleStore, ttl: number, clockValue: clock.Clock): ReputationRuleStore {
  return new CachedReputationRuleStore(inner, cache.newTtlCache<ReputationRule>(512, ttl, clockValue), 0, 0);
}

/** Selects reputation rules. Empty fields match all. */
export class ReputationRuleQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationRule[]): ReputationRule[] {
    const matched = collections.filter(items, (candidate: ReputationRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationRules(store: ReputationRuleStore, query: ReputationRuleQuery): ReputationRule[] {
  return query.apply(store.list());
}
