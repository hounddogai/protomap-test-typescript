import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFlightRule } from "./scheduled-flight-rule.js";

/** Keeps scheduled flight rules by code. */
export interface ScheduledFlightRuleStore {
  find(code: string): ScheduledFlightRule | undefined;
  save(item: ScheduledFlightRule): void;
  remove(code: string): boolean;
  list(): ScheduledFlightRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFlightRuleStore implements ScheduledFlightRuleStore {
  items: Map<string, ScheduledFlightRule>;
  order: string[];

  constructor(items: Map<string, ScheduledFlightRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFlightRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFlightRule): void {
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

  list(): ScheduledFlightRule[] {
    const out: ScheduledFlightRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFlightRuleStore(): ScheduledFlightRuleStore {
  return new MemoryScheduledFlightRuleStore(new Map<string, ScheduledFlightRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFlightRuleStore implements ScheduledFlightRuleStore {
  inner: ScheduledFlightRuleStore;
  cache: cache.TtlCache<ScheduledFlightRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFlightRuleStore,
    cacheValue: cache.TtlCache<ScheduledFlightRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFlightRule | undefined {
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

  save(item: ScheduledFlightRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFlightRule[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFlightRuleStore(inner: ScheduledFlightRuleStore, ttl: number, clockValue: clock.Clock): ScheduledFlightRuleStore {
  return new CachedScheduledFlightRuleStore(inner, cache.newTtlCache<ScheduledFlightRule>(512, ttl, clockValue), 0, 0);
}

/** Selects scheduled flight rules. Empty fields match all. */
export class ScheduledFlightRuleQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFlightRule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFlightRule[]): ScheduledFlightRule[] {
    const matched = collections.filter(items, (candidate: ScheduledFlightRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFlightRules(store: ScheduledFlightRuleStore, query: ScheduledFlightRuleQuery): ScheduledFlightRule[] {
  return query.apply(store.list());
}
