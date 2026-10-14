import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeRule } from "./nudge-rule.js";

/** Keeps nudge rules by code. */
export interface NudgeRuleStore {
  find(code: string): NudgeRule | undefined;
  save(item: NudgeRule): void;
  remove(code: string): boolean;
  list(): NudgeRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeRuleStore implements NudgeRuleStore {
  items: Map<string, NudgeRule>;
  order: string[];

  constructor(items: Map<string, NudgeRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeRule): void {
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

  list(): NudgeRule[] {
    const out: NudgeRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeRuleStore(): NudgeRuleStore {
  return new MemoryNudgeRuleStore(new Map<string, NudgeRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeRuleStore implements NudgeRuleStore {
  inner: NudgeRuleStore;
  cache: cache.TtlCache<NudgeRule>;
  hits: number;
  misses: number;

  constructor(inner: NudgeRuleStore, cacheValue: cache.TtlCache<NudgeRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeRule | undefined {
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

  save(item: NudgeRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeRule[] {
    return this.inner.list();
  }
}

export function newCachedNudgeRuleStore(inner: NudgeRuleStore, ttl: number, clockValue: clock.Clock): NudgeRuleStore {
  return new CachedNudgeRuleStore(inner, cache.newTtlCache<NudgeRule>(128, ttl, clockValue), 0, 0);
}

/** Selects nudge rules. Empty fields match all. */
export class NudgeRuleQuery {
  country: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minConversionRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeRule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeRule[]): NudgeRule[] {
    const matched = collections.filter(items, (candidate: NudgeRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeRules(store: NudgeRuleStore, query: NudgeRuleQuery): NudgeRule[] {
  return query.apply(store.list());
}
