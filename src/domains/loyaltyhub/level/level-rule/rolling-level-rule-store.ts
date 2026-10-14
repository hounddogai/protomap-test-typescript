import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingLevelRule } from "./rolling-level-rule.js";

/** Keeps rolling level rules by code. */
export interface RollingLevelRuleStore {
  find(code: string): RollingLevelRule | undefined;
  save(item: RollingLevelRule): void;
  remove(code: string): boolean;
  list(): RollingLevelRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingLevelRuleStore implements RollingLevelRuleStore {
  items: Map<string, RollingLevelRule>;
  order: string[];

  constructor(items: Map<string, RollingLevelRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingLevelRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingLevelRule): void {
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

  list(): RollingLevelRule[] {
    const out: RollingLevelRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingLevelRuleStore(): RollingLevelRuleStore {
  return new MemoryRollingLevelRuleStore(new Map<string, RollingLevelRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingLevelRuleStore implements RollingLevelRuleStore {
  inner: RollingLevelRuleStore;
  cache: cache.TtlCache<RollingLevelRule>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingLevelRuleStore,
    cacheValue: cache.TtlCache<RollingLevelRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingLevelRule | undefined {
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

  save(item: RollingLevelRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingLevelRule[] {
    return this.inner.list();
  }
}

export function newCachedRollingLevelRuleStore(inner: RollingLevelRuleStore, ttl: number, clockValue: clock.Clock): RollingLevelRuleStore {
  return new CachedRollingLevelRuleStore(inner, cache.newTtlCache<RollingLevelRule>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling level rules. Empty fields match all. */
export class RollingLevelRuleQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingLevelRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingLevelRule[]): RollingLevelRule[] {
    const matched = collections.filter(items, (candidate: RollingLevelRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingLevelRules(store: RollingLevelRuleStore, query: RollingLevelRuleQuery): RollingLevelRule[] {
  return query.apply(store.list());
}
