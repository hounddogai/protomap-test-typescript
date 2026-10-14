import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleBatch } from "./exit-rule-batch.js";

/** Keeps exit rule batches by code. */
export interface ExitRuleBatchStore {
  find(code: string): ExitRuleBatch | undefined;
  save(item: ExitRuleBatch): void;
  remove(code: string): boolean;
  list(): ExitRuleBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleBatchStore implements ExitRuleBatchStore {
  items: Map<string, ExitRuleBatch>;
  order: string[];

  constructor(items: Map<string, ExitRuleBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleBatch): void {
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

  list(): ExitRuleBatch[] {
    const out: ExitRuleBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleBatchStore(): ExitRuleBatchStore {
  return new MemoryExitRuleBatchStore(new Map<string, ExitRuleBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleBatchStore implements ExitRuleBatchStore {
  inner: ExitRuleBatchStore;
  cache: cache.TtlCache<ExitRuleBatch>;
  hits: number;
  misses: number;

  constructor(inner: ExitRuleBatchStore, cacheValue: cache.TtlCache<ExitRuleBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleBatch | undefined {
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

  save(item: ExitRuleBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleBatch[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleBatchStore(inner: ExitRuleBatchStore, ttl: number, clockValue: clock.Clock): ExitRuleBatchStore {
  return new CachedExitRuleBatchStore(inner, cache.newTtlCache<ExitRuleBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects exit rule batches. Empty fields match all. */
export class ExitRuleBatchQuery {
  segment: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minLimit: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleBatch): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleBatch[]): ExitRuleBatch[] {
    const matched = collections.filter(items, (candidate: ExitRuleBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleBatches(store: ExitRuleBatchStore, query: ExitRuleBatchQuery): ExitRuleBatch[] {
  return query.apply(store.list());
}
