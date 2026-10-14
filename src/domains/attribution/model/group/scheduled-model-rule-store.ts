import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledModelRule } from "./scheduled-model-rule.js";

/** Keeps scheduled model rules by code. */
export interface ScheduledModelRuleStore {
  find(code: string): ScheduledModelRule | undefined;
  save(item: ScheduledModelRule): void;
  remove(code: string): boolean;
  list(): ScheduledModelRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledModelRuleStore implements ScheduledModelRuleStore {
  items: Map<string, ScheduledModelRule>;
  order: string[];

  constructor(items: Map<string, ScheduledModelRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledModelRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledModelRule): void {
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

  list(): ScheduledModelRule[] {
    const out: ScheduledModelRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledModelRuleStore(): ScheduledModelRuleStore {
  return new MemoryScheduledModelRuleStore(new Map<string, ScheduledModelRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledModelRuleStore implements ScheduledModelRuleStore {
  inner: ScheduledModelRuleStore;
  cache: cache.TtlCache<ScheduledModelRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledModelRuleStore,
    cacheValue: cache.TtlCache<ScheduledModelRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledModelRule | undefined {
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

  save(item: ScheduledModelRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledModelRule[] {
    return this.inner.list();
  }
}

export function newCachedScheduledModelRuleStore(inner: ScheduledModelRuleStore, ttl: number, clockValue: clock.Clock): ScheduledModelRuleStore {
  return new CachedScheduledModelRuleStore(inner, cache.newTtlCache<ScheduledModelRule>(512, ttl, clockValue), 0, 0);
}

/** Selects scheduled model rules. Empty fields match all. */
export class ScheduledModelRuleQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledModelRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledModelRule[]): ScheduledModelRule[] {
    const matched = collections.filter(items, (candidate: ScheduledModelRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledModelRules(store: ScheduledModelRuleStore, query: ScheduledModelRuleQuery): ScheduledModelRule[] {
  return query.apply(store.list());
}
