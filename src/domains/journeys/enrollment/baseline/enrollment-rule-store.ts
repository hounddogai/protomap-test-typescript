import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentRule } from "./enrollment-rule.js";

/** Keeps enrollment rules by code. */
export interface EnrollmentRuleStore {
  find(code: string): EnrollmentRule | undefined;
  save(item: EnrollmentRule): void;
  remove(code: string): boolean;
  list(): EnrollmentRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentRuleStore implements EnrollmentRuleStore {
  items: Map<string, EnrollmentRule>;
  order: string[];

  constructor(items: Map<string, EnrollmentRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentRule): void {
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

  list(): EnrollmentRule[] {
    const out: EnrollmentRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentRuleStore(): EnrollmentRuleStore {
  return new MemoryEnrollmentRuleStore(new Map<string, EnrollmentRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentRuleStore implements EnrollmentRuleStore {
  inner: EnrollmentRuleStore;
  cache: cache.TtlCache<EnrollmentRule>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentRuleStore,
    cacheValue: cache.TtlCache<EnrollmentRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentRule | undefined {
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

  save(item: EnrollmentRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentRule[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentRuleStore(inner: EnrollmentRuleStore, ttl: number, clockValue: clock.Clock): EnrollmentRuleStore {
  return new CachedEnrollmentRuleStore(inner, cache.newTtlCache<EnrollmentRule>(512, ttl, clockValue), 0, 0);
}

/** Selects enrollment rules. Empty fields match all. */
export class EnrollmentRuleQuery {
  unit: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRevision: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentRule): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentRule[]): EnrollmentRule[] {
    const matched = collections.filter(items, (candidate: EnrollmentRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentRules(store: EnrollmentRuleStore, query: EnrollmentRuleQuery): EnrollmentRule[] {
  return query.apply(store.list());
}
