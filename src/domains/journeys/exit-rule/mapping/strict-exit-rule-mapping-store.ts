import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictExitRuleMapping } from "./strict-exit-rule-mapping.js";

/** Keeps strict exit rule mappings by code. */
export interface StrictExitRuleMappingStore {
  find(code: string): StrictExitRuleMapping | undefined;
  save(item: StrictExitRuleMapping): void;
  remove(code: string): boolean;
  list(): StrictExitRuleMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictExitRuleMappingStore implements StrictExitRuleMappingStore {
  items: Map<string, StrictExitRuleMapping>;
  order: string[];

  constructor(items: Map<string, StrictExitRuleMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictExitRuleMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictExitRuleMapping): void {
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

  list(): StrictExitRuleMapping[] {
    const out: StrictExitRuleMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictExitRuleMappingStore(): StrictExitRuleMappingStore {
  return new MemoryStrictExitRuleMappingStore(new Map<string, StrictExitRuleMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictExitRuleMappingStore implements StrictExitRuleMappingStore {
  inner: StrictExitRuleMappingStore;
  cache: cache.TtlCache<StrictExitRuleMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictExitRuleMappingStore,
    cacheValue: cache.TtlCache<StrictExitRuleMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictExitRuleMapping | undefined {
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

  save(item: StrictExitRuleMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictExitRuleMapping[] {
    return this.inner.list();
  }
}

export function newCachedStrictExitRuleMappingStore(inner: StrictExitRuleMappingStore, ttl: number, clockValue: clock.Clock): StrictExitRuleMappingStore {
  return new CachedStrictExitRuleMappingStore(
    inner,
    cache.newTtlCache<StrictExitRuleMapping>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict exit rule mappings. Empty fields match all. */
export class StrictExitRuleMappingQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictExitRuleMapping): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictExitRuleMapping[]): StrictExitRuleMapping[] {
    const matched = collections.filter(items, (candidate: StrictExitRuleMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictExitRuleMappings(store: StrictExitRuleMappingStore, query: StrictExitRuleMappingQuery): StrictExitRuleMapping[] {
  return query.apply(store.list());
}
