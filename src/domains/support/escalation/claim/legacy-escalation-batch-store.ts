import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyEscalationBatch } from "./legacy-escalation-batch.js";

/** Keeps legacy escalation batches by code. */
export interface LegacyEscalationBatchStore {
  find(code: string): LegacyEscalationBatch | undefined;
  save(item: LegacyEscalationBatch): void;
  remove(code: string): boolean;
  list(): LegacyEscalationBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyEscalationBatchStore implements LegacyEscalationBatchStore {
  items: Map<string, LegacyEscalationBatch>;
  order: string[];

  constructor(items: Map<string, LegacyEscalationBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyEscalationBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyEscalationBatch): void {
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

  list(): LegacyEscalationBatch[] {
    const out: LegacyEscalationBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyEscalationBatchStore(): LegacyEscalationBatchStore {
  return new MemoryLegacyEscalationBatchStore(new Map<string, LegacyEscalationBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyEscalationBatchStore implements LegacyEscalationBatchStore {
  inner: LegacyEscalationBatchStore;
  cache: cache.TtlCache<LegacyEscalationBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyEscalationBatchStore,
    cacheValue: cache.TtlCache<LegacyEscalationBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyEscalationBatch | undefined {
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

  save(item: LegacyEscalationBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyEscalationBatch[] {
    return this.inner.list();
  }
}

export function newCachedLegacyEscalationBatchStore(inner: LegacyEscalationBatchStore, ttl: number, clockValue: clock.Clock): LegacyEscalationBatchStore {
  return new CachedLegacyEscalationBatchStore(
    inner,
    cache.newTtlCache<LegacyEscalationBatch>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy escalation batches. Empty fields match all. */
export class LegacyEscalationBatchQuery {
  segment: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCeiling: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyEscalationBatch): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyEscalationBatch[]): LegacyEscalationBatch[] {
    const matched = collections.filter(items, (candidate: LegacyEscalationBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyEscalationBatches(store: LegacyEscalationBatchStore, query: LegacyEscalationBatchQuery): LegacyEscalationBatch[] {
  return query.apply(store.list());
}
