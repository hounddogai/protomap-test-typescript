import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitRule } from "./wait-rule.js";

/** Keeps wait rules by code. */
export interface WaitRuleStore {
  find(code: string): WaitRule | undefined;
  save(item: WaitRule): void;
  remove(code: string): boolean;
  list(): WaitRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitRuleStore implements WaitRuleStore {
  items: Map<string, WaitRule>;
  order: string[];

  constructor(items: Map<string, WaitRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitRule): void {
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

  list(): WaitRule[] {
    const out: WaitRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitRuleStore(): WaitRuleStore {
  return new MemoryWaitRuleStore(new Map<string, WaitRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitRuleStore implements WaitRuleStore {
  inner: WaitRuleStore;
  cache: cache.TtlCache<WaitRule>;
  hits: number;
  misses: number;

  constructor(inner: WaitRuleStore, cacheValue: cache.TtlCache<WaitRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitRule | undefined {
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

  save(item: WaitRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitRule[] {
    return this.inner.list();
  }
}

export function newCachedWaitRuleStore(inner: WaitRuleStore, ttl: number, clockValue: clock.Clock): WaitRuleStore {
  return new CachedWaitRuleStore(inner, cache.newTtlCache<WaitRule>(256, ttl, clockValue), 0, 0);
}

/** Selects wait rules. Empty fields match all. */
export class WaitRuleQuery {
  region: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMaximum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitRule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitRule[]): WaitRule[] {
    const matched = collections.filter(items, (candidate: WaitRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitRules(store: WaitRuleStore, query: WaitRuleQuery): WaitRule[] {
  return query.apply(store.list());
}
