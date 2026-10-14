import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofThreshold } from "./proof-threshold.js";

/** Keeps proof thresholds by code. */
export interface ProofThresholdStore {
  find(code: string): ProofThreshold | undefined;
  save(item: ProofThreshold): void;
  remove(code: string): boolean;
  list(): ProofThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofThresholdStore implements ProofThresholdStore {
  items: Map<string, ProofThreshold>;
  order: string[];

  constructor(items: Map<string, ProofThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofThreshold): void {
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

  list(): ProofThreshold[] {
    const out: ProofThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofThresholdStore(): ProofThresholdStore {
  return new MemoryProofThresholdStore(new Map<string, ProofThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofThresholdStore implements ProofThresholdStore {
  inner: ProofThresholdStore;
  cache: cache.TtlCache<ProofThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ProofThresholdStore,
    cacheValue: cache.TtlCache<ProofThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofThreshold | undefined {
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

  save(item: ProofThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofThreshold[] {
    return this.inner.list();
  }
}

export function newCachedProofThresholdStore(inner: ProofThresholdStore, ttl: number, clockValue: clock.Clock): ProofThresholdStore {
  return new CachedProofThresholdStore(inner, cache.newTtlCache<ProofThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects proof thresholds. Empty fields match all. */
export class ProofThresholdQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofThreshold[]): ProofThreshold[] {
    const matched = collections.filter(items, (candidate: ProofThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofThresholds(store: ProofThresholdStore, query: ProofThresholdQuery): ProofThreshold[] {
  return query.apply(store.list());
}
