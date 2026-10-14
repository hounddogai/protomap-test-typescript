import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPathRule } from "./pending-path-rule.js";

/** Keeps pending path rules by code. */
export interface PendingPathRuleStore {
  find(code: string): PendingPathRule | undefined;
  save(item: PendingPathRule): void;
  remove(code: string): boolean;
  list(): PendingPathRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPathRuleStore implements PendingPathRuleStore {
  items: Map<string, PendingPathRule>;
  order: string[];

  constructor(items: Map<string, PendingPathRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPathRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPathRule): void {
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

  list(): PendingPathRule[] {
    const out: PendingPathRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPathRuleStore(): PendingPathRuleStore {
  return new MemoryPendingPathRuleStore(new Map<string, PendingPathRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPathRuleStore implements PendingPathRuleStore {
  inner: PendingPathRuleStore;
  cache: cache.TtlCache<PendingPathRule>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPathRuleStore,
    cacheValue: cache.TtlCache<PendingPathRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPathRule | undefined {
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

  save(item: PendingPathRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPathRule[] {
    return this.inner.list();
  }
}

export function newCachedPendingPathRuleStore(inner: PendingPathRuleStore, ttl: number, clockValue: clock.Clock): PendingPathRuleStore {
  return new CachedPendingPathRuleStore(inner, cache.newTtlCache<PendingPathRule>(256, ttl, clockValue), 0, 0);
}

/** Selects pending path rules. Empty fields match all. */
export class PendingPathRuleQuery {
  utmSource: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPathRule): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPathRule[]): PendingPathRule[] {
    const matched = collections.filter(items, (candidate: PendingPathRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPathRules(store: PendingPathRuleStore, query: PendingPathRuleQuery): PendingPathRule[] {
  return query.apply(store.list());
}
