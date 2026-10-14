import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionRule } from "./conversion-rule.js";

/** Keeps conversion rules by code. */
export interface ConversionRuleStore {
  find(code: string): ConversionRule | undefined;
  save(item: ConversionRule): void;
  remove(code: string): boolean;
  list(): ConversionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionRuleStore implements ConversionRuleStore {
  items: Map<string, ConversionRule>;
  order: string[];

  constructor(items: Map<string, ConversionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionRule): void {
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

  list(): ConversionRule[] {
    const out: ConversionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionRuleStore(): ConversionRuleStore {
  return new MemoryConversionRuleStore(new Map<string, ConversionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionRuleStore implements ConversionRuleStore {
  inner: ConversionRuleStore;
  cache: cache.TtlCache<ConversionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionRuleStore,
    cacheValue: cache.TtlCache<ConversionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionRule | undefined {
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

  save(item: ConversionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionRule[] {
    return this.inner.list();
  }
}

export function newCachedConversionRuleStore(inner: ConversionRuleStore, ttl: number, clockValue: clock.Clock): ConversionRuleStore {
  return new CachedConversionRuleStore(inner, cache.newTtlCache<ConversionRule>(128, ttl, clockValue), 0, 0);
}

/** Selects conversion rules. Empty fields match all. */
export class ConversionRuleQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionRule[]): ConversionRule[] {
    const matched = collections.filter(items, (candidate: ConversionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionRules(store: ConversionRuleStore, query: ConversionRuleQuery): ConversionRule[] {
  return query.apply(store.list());
}
