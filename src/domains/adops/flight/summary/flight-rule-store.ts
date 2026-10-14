import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightRule } from "./flight-rule.js";

/** Keeps flight rules by code. */
export interface FlightRuleStore {
  find(code: string): FlightRule | undefined;
  save(item: FlightRule): void;
  remove(code: string): boolean;
  list(): FlightRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightRuleStore implements FlightRuleStore {
  items: Map<string, FlightRule>;
  order: string[];

  constructor(items: Map<string, FlightRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightRule): void {
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

  list(): FlightRule[] {
    const out: FlightRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightRuleStore(): FlightRuleStore {
  return new MemoryFlightRuleStore(new Map<string, FlightRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightRuleStore implements FlightRuleStore {
  inner: FlightRuleStore;
  cache: cache.TtlCache<FlightRule>;
  hits: number;
  misses: number;

  constructor(inner: FlightRuleStore, cacheValue: cache.TtlCache<FlightRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightRule | undefined {
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

  save(item: FlightRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightRule[] {
    return this.inner.list();
  }
}

export function newCachedFlightRuleStore(inner: FlightRuleStore, ttl: number, clockValue: clock.Clock): FlightRuleStore {
  return new CachedFlightRuleStore(inner, cache.newTtlCache<FlightRule>(64, ttl, clockValue), 0, 0);
}

/** Selects flight rules. Empty fields match all. */
export class FlightRuleQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightRule[]): FlightRule[] {
    const matched = collections.filter(items, (candidate: FlightRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightRules(store: FlightRuleStore, query: FlightRuleQuery): FlightRule[] {
  return query.apply(store.list());
}
