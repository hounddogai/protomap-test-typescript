import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofAdjustment } from "./proof-adjustment.js";

/** Keeps proof adjustments by code. */
export interface ProofAdjustmentStore {
  find(code: string): ProofAdjustment | undefined;
  save(item: ProofAdjustment): void;
  remove(code: string): boolean;
  list(): ProofAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofAdjustmentStore implements ProofAdjustmentStore {
  items: Map<string, ProofAdjustment>;
  order: string[];

  constructor(items: Map<string, ProofAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofAdjustment): void {
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

  list(): ProofAdjustment[] {
    const out: ProofAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofAdjustmentStore(): ProofAdjustmentStore {
  return new MemoryProofAdjustmentStore(new Map<string, ProofAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofAdjustmentStore implements ProofAdjustmentStore {
  inner: ProofAdjustmentStore;
  cache: cache.TtlCache<ProofAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ProofAdjustmentStore,
    cacheValue: cache.TtlCache<ProofAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofAdjustment | undefined {
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

  save(item: ProofAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedProofAdjustmentStore(inner: ProofAdjustmentStore, ttl: number, clockValue: clock.Clock): ProofAdjustmentStore {
  return new CachedProofAdjustmentStore(inner, cache.newTtlCache<ProofAdjustment>(1024, ttl, clockValue), 0, 0);
}

/** Selects proof adjustments. Empty fields match all. */
export class ProofAdjustmentQuery {
  category: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSequence: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofAdjustment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofAdjustment[]): ProofAdjustment[] {
    const matched = collections.filter(items, (candidate: ProofAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofAdjustments(store: ProofAdjustmentStore, query: ProofAdjustmentQuery): ProofAdjustment[] {
  return query.apply(store.list());
}
