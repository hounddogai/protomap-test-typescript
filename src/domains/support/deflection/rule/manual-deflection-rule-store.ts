import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualDeflectionRule } from "./manual-deflection-rule.js";

/** Keeps manual deflection rules by code. */
export interface ManualDeflectionRuleStore {
  find(code: string): ManualDeflectionRule | undefined;
  save(item: ManualDeflectionRule): void;
  remove(code: string): boolean;
  list(): ManualDeflectionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualDeflectionRuleStore implements ManualDeflectionRuleStore {
  items: Map<string, ManualDeflectionRule>;
  order: string[];

  constructor(items: Map<string, ManualDeflectionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualDeflectionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualDeflectionRule): void {
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

  list(): ManualDeflectionRule[] {
    const out: ManualDeflectionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualDeflectionRuleStore(): ManualDeflectionRuleStore {
  return new MemoryManualDeflectionRuleStore(new Map<string, ManualDeflectionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualDeflectionRuleStore implements ManualDeflectionRuleStore {
  inner: ManualDeflectionRuleStore;
  cache: cache.TtlCache<ManualDeflectionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualDeflectionRuleStore,
    cacheValue: cache.TtlCache<ManualDeflectionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualDeflectionRule | undefined {
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

  save(item: ManualDeflectionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualDeflectionRule[] {
    return this.inner.list();
  }
}

export function newCachedManualDeflectionRuleStore(inner: ManualDeflectionRuleStore, ttl: number, clockValue: clock.Clock): ManualDeflectionRuleStore {
  return new CachedManualDeflectionRuleStore(
    inner,
    cache.newTtlCache<ManualDeflectionRule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual deflection rules. Empty fields match all. */
export class ManualDeflectionRuleQuery {
  utmSource: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMaximum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualDeflectionRule): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualDeflectionRule[]): ManualDeflectionRule[] {
    const matched = collections.filter(items, (candidate: ManualDeflectionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualDeflectionRules(store: ManualDeflectionRuleStore, query: ManualDeflectionRuleQuery): ManualDeflectionRule[] {
  return query.apply(store.list());
}
