import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryProofRule } from "./primary-proof-rule.js";

/** Keeps primary proof rules by code. */
export interface PrimaryProofRuleStore {
  find(code: string): PrimaryProofRule | undefined;
  save(item: PrimaryProofRule): void;
  remove(code: string): boolean;
  list(): PrimaryProofRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryProofRuleStore implements PrimaryProofRuleStore {
  items: Map<string, PrimaryProofRule>;
  order: string[];

  constructor(items: Map<string, PrimaryProofRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryProofRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryProofRule): void {
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

  list(): PrimaryProofRule[] {
    const out: PrimaryProofRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryProofRuleStore(): PrimaryProofRuleStore {
  return new MemoryPrimaryProofRuleStore(new Map<string, PrimaryProofRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryProofRuleStore implements PrimaryProofRuleStore {
  inner: PrimaryProofRuleStore;
  cache: cache.TtlCache<PrimaryProofRule>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryProofRuleStore,
    cacheValue: cache.TtlCache<PrimaryProofRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryProofRule | undefined {
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

  save(item: PrimaryProofRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryProofRule[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryProofRuleStore(inner: PrimaryProofRuleStore, ttl: number, clockValue: clock.Clock): PrimaryProofRuleStore {
  return new CachedPrimaryProofRuleStore(inner, cache.newTtlCache<PrimaryProofRule>(64, ttl, clockValue), 0, 0);
}

/** Selects primary proof rules. Empty fields match all. */
export class PrimaryProofRuleQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryProofRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryProofRule[]): PrimaryProofRule[] {
    const matched = collections.filter(items, (candidate: PrimaryProofRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryProofRules(store: PrimaryProofRuleStore, query: PrimaryProofRuleQuery): PrimaryProofRule[] {
  return query.apply(store.list());
}
