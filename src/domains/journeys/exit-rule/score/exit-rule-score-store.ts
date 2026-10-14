import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleScore } from "./exit-rule-score.js";

/** Keeps exit rule scores by code. */
export interface ExitRuleScoreStore {
  find(code: string): ExitRuleScore | undefined;
  save(item: ExitRuleScore): void;
  remove(code: string): boolean;
  list(): ExitRuleScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleScoreStore implements ExitRuleScoreStore {
  items: Map<string, ExitRuleScore>;
  order: string[];

  constructor(items: Map<string, ExitRuleScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleScore): void {
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

  list(): ExitRuleScore[] {
    const out: ExitRuleScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleScoreStore(): ExitRuleScoreStore {
  return new MemoryExitRuleScoreStore(new Map<string, ExitRuleScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleScoreStore implements ExitRuleScoreStore {
  inner: ExitRuleScoreStore;
  cache: cache.TtlCache<ExitRuleScore>;
  hits: number;
  misses: number;

  constructor(inner: ExitRuleScoreStore, cacheValue: cache.TtlCache<ExitRuleScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleScore | undefined {
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

  save(item: ExitRuleScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleScore[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleScoreStore(inner: ExitRuleScoreStore, ttl: number, clockValue: clock.Clock): ExitRuleScoreStore {
  return new CachedExitRuleScoreStore(inner, cache.newTtlCache<ExitRuleScore>(128, ttl, clockValue), 0, 0);
}

/** Selects exit rule scores. Empty fields match all. */
export class ExitRuleScoreQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleScore[]): ExitRuleScore[] {
    const matched = collections.filter(items, (candidate: ExitRuleScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleScores(store: ExitRuleScoreStore, query: ExitRuleScoreQuery): ExitRuleScore[] {
  return query.apply(store.list());
}
