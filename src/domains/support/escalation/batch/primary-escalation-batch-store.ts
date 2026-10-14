import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryEscalationBatch } from "./primary-escalation-batch.js";

/** Keeps primary escalation batches by code. */
export interface PrimaryEscalationBatchStore {
  find(code: string): PrimaryEscalationBatch | undefined;
  save(item: PrimaryEscalationBatch): void;
  remove(code: string): boolean;
  list(): PrimaryEscalationBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryEscalationBatchStore implements PrimaryEscalationBatchStore {
  items: Map<string, PrimaryEscalationBatch>;
  order: string[];

  constructor(items: Map<string, PrimaryEscalationBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryEscalationBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryEscalationBatch): void {
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

  list(): PrimaryEscalationBatch[] {
    const out: PrimaryEscalationBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryEscalationBatchStore(): PrimaryEscalationBatchStore {
  return new MemoryPrimaryEscalationBatchStore(new Map<string, PrimaryEscalationBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryEscalationBatchStore implements PrimaryEscalationBatchStore {
  inner: PrimaryEscalationBatchStore;
  cache: cache.TtlCache<PrimaryEscalationBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryEscalationBatchStore,
    cacheValue: cache.TtlCache<PrimaryEscalationBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryEscalationBatch | undefined {
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

  save(item: PrimaryEscalationBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryEscalationBatch[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryEscalationBatchStore(inner: PrimaryEscalationBatchStore, ttl: number, clockValue: clock.Clock): PrimaryEscalationBatchStore {
  return new CachedPrimaryEscalationBatchStore(
    inner,
    cache.newTtlCache<PrimaryEscalationBatch>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary escalation batches. Empty fields match all. */
export class PrimaryEscalationBatchQuery {
  segment: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryEscalationBatch): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryEscalationBatch[]): PrimaryEscalationBatch[] {
    const matched = collections.filter(items, (candidate: PrimaryEscalationBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryEscalationBatches(store: PrimaryEscalationBatchStore, query: PrimaryEscalationBatchQuery): PrimaryEscalationBatch[] {
  return query.apply(store.list());
}
