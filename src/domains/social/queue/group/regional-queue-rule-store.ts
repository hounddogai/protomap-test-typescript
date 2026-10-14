import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalQueueRule } from "./regional-queue-rule.js";

/** Keeps regional queue rules by code. */
export interface RegionalQueueRuleStore {
  find(code: string): RegionalQueueRule | undefined;
  save(item: RegionalQueueRule): void;
  remove(code: string): boolean;
  list(): RegionalQueueRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalQueueRuleStore implements RegionalQueueRuleStore {
  items: Map<string, RegionalQueueRule>;
  order: string[];

  constructor(items: Map<string, RegionalQueueRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalQueueRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalQueueRule): void {
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

  list(): RegionalQueueRule[] {
    const out: RegionalQueueRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalQueueRuleStore(): RegionalQueueRuleStore {
  return new MemoryRegionalQueueRuleStore(new Map<string, RegionalQueueRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalQueueRuleStore implements RegionalQueueRuleStore {
  inner: RegionalQueueRuleStore;
  cache: cache.TtlCache<RegionalQueueRule>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalQueueRuleStore,
    cacheValue: cache.TtlCache<RegionalQueueRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalQueueRule | undefined {
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

  save(item: RegionalQueueRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalQueueRule[] {
    return this.inner.list();
  }
}

export function newCachedRegionalQueueRuleStore(inner: RegionalQueueRuleStore, ttl: number, clockValue: clock.Clock): RegionalQueueRuleStore {
  return new CachedRegionalQueueRuleStore(inner, cache.newTtlCache<RegionalQueueRule>(256, ttl, clockValue), 0, 0);
}

/** Selects regional queue rules. Empty fields match all. */
export class RegionalQueueRuleQuery {
  utmSource: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalQueueRule): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalQueueRule[]): RegionalQueueRule[] {
    const matched = collections.filter(items, (candidate: RegionalQueueRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalQueueRules(store: RegionalQueueRuleStore, query: RegionalQueueRuleQuery): RegionalQueueRule[] {
  return query.apply(store.list());
}
