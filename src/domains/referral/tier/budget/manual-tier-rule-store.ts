import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTierRule } from "./manual-tier-rule.js";

/** Keeps manual tier rules by code. */
export interface ManualTierRuleStore {
  find(code: string): ManualTierRule | undefined;
  save(item: ManualTierRule): void;
  remove(code: string): boolean;
  list(): ManualTierRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTierRuleStore implements ManualTierRuleStore {
  items: Map<string, ManualTierRule>;
  order: string[];

  constructor(items: Map<string, ManualTierRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTierRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTierRule): void {
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

  list(): ManualTierRule[] {
    const out: ManualTierRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTierRuleStore(): ManualTierRuleStore {
  return new MemoryManualTierRuleStore(new Map<string, ManualTierRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTierRuleStore implements ManualTierRuleStore {
  inner: ManualTierRuleStore;
  cache: cache.TtlCache<ManualTierRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTierRuleStore,
    cacheValue: cache.TtlCache<ManualTierRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTierRule | undefined {
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

  save(item: ManualTierRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTierRule[] {
    return this.inner.list();
  }
}

export function newCachedManualTierRuleStore(inner: ManualTierRuleStore, ttl: number, clockValue: clock.Clock): ManualTierRuleStore {
  return new CachedManualTierRuleStore(inner, cache.newTtlCache<ManualTierRule>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual tier rules. Empty fields match all. */
export class ManualTierRuleQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTierRule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTierRule[]): ManualTierRule[] {
    const matched = collections.filter(items, (candidate: ManualTierRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTierRules(store: ManualTierRuleStore, query: ManualTierRuleQuery): ManualTierRule[] {
  return query.apply(store.list());
}
