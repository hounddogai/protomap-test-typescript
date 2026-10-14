import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedNudgeBatch } from "./capped-nudge-batch.js";

/** Keeps capped nudge batches by code. */
export interface CappedNudgeBatchStore {
  find(code: string): CappedNudgeBatch | undefined;
  save(item: CappedNudgeBatch): void;
  remove(code: string): boolean;
  list(): CappedNudgeBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedNudgeBatchStore implements CappedNudgeBatchStore {
  items: Map<string, CappedNudgeBatch>;
  order: string[];

  constructor(items: Map<string, CappedNudgeBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedNudgeBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedNudgeBatch): void {
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

  list(): CappedNudgeBatch[] {
    const out: CappedNudgeBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedNudgeBatchStore(): CappedNudgeBatchStore {
  return new MemoryCappedNudgeBatchStore(new Map<string, CappedNudgeBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedNudgeBatchStore implements CappedNudgeBatchStore {
  inner: CappedNudgeBatchStore;
  cache: cache.TtlCache<CappedNudgeBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedNudgeBatchStore,
    cacheValue: cache.TtlCache<CappedNudgeBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedNudgeBatch | undefined {
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

  save(item: CappedNudgeBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedNudgeBatch[] {
    return this.inner.list();
  }
}

export function newCachedCappedNudgeBatchStore(inner: CappedNudgeBatchStore, ttl: number, clockValue: clock.Clock): CappedNudgeBatchStore {
  return new CachedCappedNudgeBatchStore(inner, cache.newTtlCache<CappedNudgeBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects capped nudge batches. Empty fields match all. */
export class CappedNudgeBatchQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedNudgeBatch): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedNudgeBatch[]): CappedNudgeBatch[] {
    const matched = collections.filter(items, (candidate: CappedNudgeBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedNudgeBatches(store: CappedNudgeBatchStore, query: CappedNudgeBatchQuery): CappedNudgeBatch[] {
  return query.apply(store.list());
}
