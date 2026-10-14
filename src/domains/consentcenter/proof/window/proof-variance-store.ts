import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofVariance } from "./proof-variance.js";

/** Keeps proof variances by code. */
export interface ProofVarianceStore {
  find(code: string): ProofVariance | undefined;
  save(item: ProofVariance): void;
  remove(code: string): boolean;
  list(): ProofVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofVarianceStore implements ProofVarianceStore {
  items: Map<string, ProofVariance>;
  order: string[];

  constructor(items: Map<string, ProofVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofVariance): void {
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

  list(): ProofVariance[] {
    const out: ProofVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofVarianceStore(): ProofVarianceStore {
  return new MemoryProofVarianceStore(new Map<string, ProofVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofVarianceStore implements ProofVarianceStore {
  inner: ProofVarianceStore;
  cache: cache.TtlCache<ProofVariance>;
  hits: number;
  misses: number;

  constructor(inner: ProofVarianceStore, cacheValue: cache.TtlCache<ProofVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofVariance | undefined {
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

  save(item: ProofVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofVariance[] {
    return this.inner.list();
  }
}

export function newCachedProofVarianceStore(inner: ProofVarianceStore, ttl: number, clockValue: clock.Clock): ProofVarianceStore {
  return new CachedProofVarianceStore(inner, cache.newTtlCache<ProofVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects proof variances. Empty fields match all. */
export class ProofVarianceQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofVariance[]): ProofVariance[] {
    const matched = collections.filter(items, (candidate: ProofVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofVariances(store: ProofVarianceStore, query: ProofVarianceQuery): ProofVariance[] {
  return query.apply(store.list());
}
