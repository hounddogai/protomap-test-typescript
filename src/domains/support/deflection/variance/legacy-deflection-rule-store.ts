import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDeflectionRule } from "./legacy-deflection-rule.js";

/** Keeps legacy deflection rules by code. */
export interface LegacyDeflectionRuleStore {
  find(code: string): LegacyDeflectionRule | undefined;
  save(item: LegacyDeflectionRule): void;
  remove(code: string): boolean;
  list(): LegacyDeflectionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDeflectionRuleStore implements LegacyDeflectionRuleStore {
  items: Map<string, LegacyDeflectionRule>;
  order: string[];

  constructor(items: Map<string, LegacyDeflectionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDeflectionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDeflectionRule): void {
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

  list(): LegacyDeflectionRule[] {
    const out: LegacyDeflectionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDeflectionRuleStore(): LegacyDeflectionRuleStore {
  return new MemoryLegacyDeflectionRuleStore(new Map<string, LegacyDeflectionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDeflectionRuleStore implements LegacyDeflectionRuleStore {
  inner: LegacyDeflectionRuleStore;
  cache: cache.TtlCache<LegacyDeflectionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDeflectionRuleStore,
    cacheValue: cache.TtlCache<LegacyDeflectionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDeflectionRule | undefined {
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

  save(item: LegacyDeflectionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDeflectionRule[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDeflectionRuleStore(inner: LegacyDeflectionRuleStore, ttl: number, clockValue: clock.Clock): LegacyDeflectionRuleStore {
  return new CachedLegacyDeflectionRuleStore(
    inner,
    cache.newTtlCache<LegacyDeflectionRule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy deflection rules. Empty fields match all. */
export class LegacyDeflectionRuleQuery {
  country: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSequence: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDeflectionRule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDeflectionRule[]): LegacyDeflectionRule[] {
    const matched = collections.filter(items, (candidate: LegacyDeflectionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDeflectionRules(store: LegacyDeflectionRuleStore, query: LegacyDeflectionRuleQuery): LegacyDeflectionRule[] {
  return query.apply(store.list());
}
