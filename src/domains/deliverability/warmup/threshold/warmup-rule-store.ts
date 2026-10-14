import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupRule } from "./warmup-rule.js";

/** Keeps warmup rules by code. */
export interface WarmupRuleStore {
  find(code: string): WarmupRule | undefined;
  save(item: WarmupRule): void;
  remove(code: string): boolean;
  list(): WarmupRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupRuleStore implements WarmupRuleStore {
  items: Map<string, WarmupRule>;
  order: string[];

  constructor(items: Map<string, WarmupRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupRule): void {
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

  list(): WarmupRule[] {
    const out: WarmupRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupRuleStore(): WarmupRuleStore {
  return new MemoryWarmupRuleStore(new Map<string, WarmupRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupRuleStore implements WarmupRuleStore {
  inner: WarmupRuleStore;
  cache: cache.TtlCache<WarmupRule>;
  hits: number;
  misses: number;

  constructor(inner: WarmupRuleStore, cacheValue: cache.TtlCache<WarmupRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupRule | undefined {
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

  save(item: WarmupRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupRule[] {
    return this.inner.list();
  }
}

export function newCachedWarmupRuleStore(inner: WarmupRuleStore, ttl: number, clockValue: clock.Clock): WarmupRuleStore {
  return new CachedWarmupRuleStore(inner, cache.newTtlCache<WarmupRule>(512, ttl, clockValue), 0, 0);
}

/** Selects warmup rules. Empty fields match all. */
export class WarmupRuleQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupRule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupRule[]): WarmupRule[] {
    const matched = collections.filter(items, (candidate: WarmupRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupRules(store: WarmupRuleStore, query: WarmupRuleQuery): WarmupRule[] {
  return query.apply(store.list());
}
