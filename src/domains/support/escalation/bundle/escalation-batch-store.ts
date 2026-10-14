import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationBatch } from "./escalation-batch.js";

/** Keeps escalation batches by code. */
export interface EscalationBatchStore {
  find(code: string): EscalationBatch | undefined;
  save(item: EscalationBatch): void;
  remove(code: string): boolean;
  list(): EscalationBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationBatchStore implements EscalationBatchStore {
  items: Map<string, EscalationBatch>;
  order: string[];

  constructor(items: Map<string, EscalationBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationBatch): void {
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

  list(): EscalationBatch[] {
    const out: EscalationBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationBatchStore(): EscalationBatchStore {
  return new MemoryEscalationBatchStore(new Map<string, EscalationBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationBatchStore implements EscalationBatchStore {
  inner: EscalationBatchStore;
  cache: cache.TtlCache<EscalationBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationBatchStore,
    cacheValue: cache.TtlCache<EscalationBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationBatch | undefined {
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

  save(item: EscalationBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationBatch[] {
    return this.inner.list();
  }
}

export function newCachedEscalationBatchStore(inner: EscalationBatchStore, ttl: number, clockValue: clock.Clock): EscalationBatchStore {
  return new CachedEscalationBatchStore(inner, cache.newTtlCache<EscalationBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation batches. Empty fields match all. */
export class EscalationBatchQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationBatch): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationBatch[]): EscalationBatch[] {
    const matched = collections.filter(items, (candidate: EscalationBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationBatches(store: EscalationBatchStore, query: EscalationBatchQuery): EscalationBatch[] {
  return query.apply(store.list());
}
