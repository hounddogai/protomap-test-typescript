import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionRule } from "./deflection-rule.js";

/** Keeps deflection rules by code. */
export interface DeflectionRuleStore {
  find(code: string): DeflectionRule | undefined;
  save(item: DeflectionRule): void;
  remove(code: string): boolean;
  list(): DeflectionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionRuleStore implements DeflectionRuleStore {
  items: Map<string, DeflectionRule>;
  order: string[];

  constructor(items: Map<string, DeflectionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionRule): void {
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

  list(): DeflectionRule[] {
    const out: DeflectionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionRuleStore(): DeflectionRuleStore {
  return new MemoryDeflectionRuleStore(new Map<string, DeflectionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionRuleStore implements DeflectionRuleStore {
  inner: DeflectionRuleStore;
  cache: cache.TtlCache<DeflectionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionRuleStore,
    cacheValue: cache.TtlCache<DeflectionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionRule | undefined {
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

  save(item: DeflectionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionRule[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionRuleStore(inner: DeflectionRuleStore, ttl: number, clockValue: clock.Clock): DeflectionRuleStore {
  return new CachedDeflectionRuleStore(inner, cache.newTtlCache<DeflectionRule>(128, ttl, clockValue), 0, 0);
}

/** Selects deflection rules. Empty fields match all. */
export class DeflectionRuleQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionRule[]): DeflectionRule[] {
    const matched = collections.filter(items, (candidate: DeflectionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionRules(store: DeflectionRuleStore, query: DeflectionRuleQuery): DeflectionRule[] {
  return query.apply(store.list());
}
