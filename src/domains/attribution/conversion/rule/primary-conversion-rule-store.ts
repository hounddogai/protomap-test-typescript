import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryConversionRule } from "./primary-conversion-rule.js";

/** Keeps primary conversion rules by code. */
export interface PrimaryConversionRuleStore {
  find(code: string): PrimaryConversionRule | undefined;
  save(item: PrimaryConversionRule): void;
  remove(code: string): boolean;
  list(): PrimaryConversionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryConversionRuleStore implements PrimaryConversionRuleStore {
  items: Map<string, PrimaryConversionRule>;
  order: string[];

  constructor(items: Map<string, PrimaryConversionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryConversionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryConversionRule): void {
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

  list(): PrimaryConversionRule[] {
    const out: PrimaryConversionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryConversionRuleStore(): PrimaryConversionRuleStore {
  return new MemoryPrimaryConversionRuleStore(new Map<string, PrimaryConversionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryConversionRuleStore implements PrimaryConversionRuleStore {
  inner: PrimaryConversionRuleStore;
  cache: cache.TtlCache<PrimaryConversionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryConversionRuleStore,
    cacheValue: cache.TtlCache<PrimaryConversionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryConversionRule | undefined {
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

  save(item: PrimaryConversionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryConversionRule[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryConversionRuleStore(inner: PrimaryConversionRuleStore, ttl: number, clockValue: clock.Clock): PrimaryConversionRuleStore {
  return new CachedPrimaryConversionRuleStore(
    inner,
    cache.newTtlCache<PrimaryConversionRule>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary conversion rules. Empty fields match all. */
export class PrimaryConversionRuleQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryConversionRule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryConversionRule[]): PrimaryConversionRule[] {
    const matched = collections.filter(items, (candidate: PrimaryConversionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryConversionRules(store: PrimaryConversionRuleStore, query: PrimaryConversionRuleQuery): PrimaryConversionRule[] {
  return query.apply(store.list());
}
