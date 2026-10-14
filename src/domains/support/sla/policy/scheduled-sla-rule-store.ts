import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSlaRule } from "./scheduled-sla-rule.js";

/** Keeps scheduled sla rules by code. */
export interface ScheduledSlaRuleStore {
  find(code: string): ScheduledSlaRule | undefined;
  save(item: ScheduledSlaRule): void;
  remove(code: string): boolean;
  list(): ScheduledSlaRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSlaRuleStore implements ScheduledSlaRuleStore {
  items: Map<string, ScheduledSlaRule>;
  order: string[];

  constructor(items: Map<string, ScheduledSlaRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSlaRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSlaRule): void {
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

  list(): ScheduledSlaRule[] {
    const out: ScheduledSlaRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSlaRuleStore(): ScheduledSlaRuleStore {
  return new MemoryScheduledSlaRuleStore(new Map<string, ScheduledSlaRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSlaRuleStore implements ScheduledSlaRuleStore {
  inner: ScheduledSlaRuleStore;
  cache: cache.TtlCache<ScheduledSlaRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSlaRuleStore,
    cacheValue: cache.TtlCache<ScheduledSlaRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSlaRule | undefined {
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

  save(item: ScheduledSlaRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSlaRule[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSlaRuleStore(inner: ScheduledSlaRuleStore, ttl: number, clockValue: clock.Clock): ScheduledSlaRuleStore {
  return new CachedScheduledSlaRuleStore(inner, cache.newTtlCache<ScheduledSlaRule>(1024, ttl, clockValue), 0, 0);
}

/** Selects scheduled sla rules. Empty fields match all. */
export class ScheduledSlaRuleQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSlaRule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSlaRule[]): ScheduledSlaRule[] {
    const matched = collections.filter(items, (candidate: ScheduledSlaRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSlaRules(store: ScheduledSlaRuleStore, query: ScheduledSlaRuleQuery): ScheduledSlaRule[] {
  return query.apply(store.list());
}
