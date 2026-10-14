import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleOverride } from "./exit-rule-override.js";

/** Keeps exit rule overrides by code. */
export interface ExitRuleOverrideStore {
  find(code: string): ExitRuleOverride | undefined;
  save(item: ExitRuleOverride): void;
  remove(code: string): boolean;
  list(): ExitRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleOverrideStore implements ExitRuleOverrideStore {
  items: Map<string, ExitRuleOverride>;
  order: string[];

  constructor(items: Map<string, ExitRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleOverride): void {
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

  list(): ExitRuleOverride[] {
    const out: ExitRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleOverrideStore(): ExitRuleOverrideStore {
  return new MemoryExitRuleOverrideStore(new Map<string, ExitRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleOverrideStore implements ExitRuleOverrideStore {
  inner: ExitRuleOverrideStore;
  cache: cache.TtlCache<ExitRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleOverrideStore,
    cacheValue: cache.TtlCache<ExitRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleOverride | undefined {
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

  save(item: ExitRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleOverrideStore(inner: ExitRuleOverrideStore, ttl: number, clockValue: clock.Clock): ExitRuleOverrideStore {
  return new CachedExitRuleOverrideStore(inner, cache.newTtlCache<ExitRuleOverride>(1024, ttl, clockValue), 0, 0);
}

/** Selects exit rule overrides. Empty fields match all. */
export class ExitRuleOverrideQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleOverride[]): ExitRuleOverride[] {
    const matched = collections.filter(items, (candidate: ExitRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleOverrides(store: ExitRuleOverrideStore, query: ExitRuleOverrideQuery): ExitRuleOverride[] {
  return query.apply(store.list());
}
