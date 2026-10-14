import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPreferenceRule } from "./fallback-preference-rule.js";

/** Keeps fallback preference rules by code. */
export interface FallbackPreferenceRuleStore {
  find(code: string): FallbackPreferenceRule | undefined;
  save(item: FallbackPreferenceRule): void;
  remove(code: string): boolean;
  list(): FallbackPreferenceRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPreferenceRuleStore implements FallbackPreferenceRuleStore {
  items: Map<string, FallbackPreferenceRule>;
  order: string[];

  constructor(items: Map<string, FallbackPreferenceRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPreferenceRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPreferenceRule): void {
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

  list(): FallbackPreferenceRule[] {
    const out: FallbackPreferenceRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPreferenceRuleStore(): FallbackPreferenceRuleStore {
  return new MemoryFallbackPreferenceRuleStore(new Map<string, FallbackPreferenceRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPreferenceRuleStore implements FallbackPreferenceRuleStore {
  inner: FallbackPreferenceRuleStore;
  cache: cache.TtlCache<FallbackPreferenceRule>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPreferenceRuleStore,
    cacheValue: cache.TtlCache<FallbackPreferenceRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPreferenceRule | undefined {
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

  save(item: FallbackPreferenceRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPreferenceRule[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPreferenceRuleStore(inner: FallbackPreferenceRuleStore, ttl: number, clockValue: clock.Clock): FallbackPreferenceRuleStore {
  return new CachedFallbackPreferenceRuleStore(
    inner,
    cache.newTtlCache<FallbackPreferenceRule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback preference rules. Empty fields match all. */
export class FallbackPreferenceRuleQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPreferenceRule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPreferenceRule[]): FallbackPreferenceRule[] {
    const matched = collections.filter(items, (candidate: FallbackPreferenceRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPreferenceRules(store: FallbackPreferenceRuleStore, query: FallbackPreferenceRuleQuery): FallbackPreferenceRule[] {
  return query.apply(store.list());
}
