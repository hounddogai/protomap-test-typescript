import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleMapping } from "./exit-rule-mapping.js";

/** Keeps exit rule mappings by code. */
export interface ExitRuleMappingStore {
  find(code: string): ExitRuleMapping | undefined;
  save(item: ExitRuleMapping): void;
  remove(code: string): boolean;
  list(): ExitRuleMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleMappingStore implements ExitRuleMappingStore {
  items: Map<string, ExitRuleMapping>;
  order: string[];

  constructor(items: Map<string, ExitRuleMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleMapping): void {
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

  list(): ExitRuleMapping[] {
    const out: ExitRuleMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleMappingStore(): ExitRuleMappingStore {
  return new MemoryExitRuleMappingStore(new Map<string, ExitRuleMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleMappingStore implements ExitRuleMappingStore {
  inner: ExitRuleMappingStore;
  cache: cache.TtlCache<ExitRuleMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleMappingStore,
    cacheValue: cache.TtlCache<ExitRuleMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleMapping | undefined {
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

  save(item: ExitRuleMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleMapping[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleMappingStore(inner: ExitRuleMappingStore, ttl: number, clockValue: clock.Clock): ExitRuleMappingStore {
  return new CachedExitRuleMappingStore(inner, cache.newTtlCache<ExitRuleMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects exit rule mappings. Empty fields match all. */
export class ExitRuleMappingQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleMapping[]): ExitRuleMapping[] {
    const matched = collections.filter(items, (candidate: ExitRuleMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleMappings(store: ExitRuleMappingStore, query: ExitRuleMappingQuery): ExitRuleMapping[] {
  return query.apply(store.list());
}
