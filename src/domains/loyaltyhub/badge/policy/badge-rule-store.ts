import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeRule } from "./badge-rule.js";

/** Keeps badge rules by code. */
export interface BadgeRuleStore {
  find(code: string): BadgeRule | undefined;
  save(item: BadgeRule): void;
  remove(code: string): boolean;
  list(): BadgeRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeRuleStore implements BadgeRuleStore {
  items: Map<string, BadgeRule>;
  order: string[];

  constructor(items: Map<string, BadgeRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeRule): void {
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

  list(): BadgeRule[] {
    const out: BadgeRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeRuleStore(): BadgeRuleStore {
  return new MemoryBadgeRuleStore(new Map<string, BadgeRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeRuleStore implements BadgeRuleStore {
  inner: BadgeRuleStore;
  cache: cache.TtlCache<BadgeRule>;
  hits: number;
  misses: number;

  constructor(inner: BadgeRuleStore, cacheValue: cache.TtlCache<BadgeRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeRule | undefined {
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

  save(item: BadgeRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeRule[] {
    return this.inner.list();
  }
}

export function newCachedBadgeRuleStore(inner: BadgeRuleStore, ttl: number, clockValue: clock.Clock): BadgeRuleStore {
  return new CachedBadgeRuleStore(inner, cache.newTtlCache<BadgeRule>(64, ttl, clockValue), 0, 0);
}

/** Selects badge rules. Empty fields match all. */
export class BadgeRuleQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeRule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeRule[]): BadgeRule[] {
    const matched = collections.filter(items, (candidate: BadgeRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeRules(store: BadgeRuleStore, query: BadgeRuleQuery): BadgeRule[] {
  return query.apply(store.list());
}
