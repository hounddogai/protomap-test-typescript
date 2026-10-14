import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofMetric } from "./proof-metric.js";

/** Keeps proof metrics by code. */
export interface ProofMetricStore {
  find(code: string): ProofMetric | undefined;
  save(item: ProofMetric): void;
  remove(code: string): boolean;
  list(): ProofMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofMetricStore implements ProofMetricStore {
  items: Map<string, ProofMetric>;
  order: string[];

  constructor(items: Map<string, ProofMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofMetric): void {
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

  list(): ProofMetric[] {
    const out: ProofMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofMetricStore(): ProofMetricStore {
  return new MemoryProofMetricStore(new Map<string, ProofMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofMetricStore implements ProofMetricStore {
  inner: ProofMetricStore;
  cache: cache.TtlCache<ProofMetric>;
  hits: number;
  misses: number;

  constructor(inner: ProofMetricStore, cacheValue: cache.TtlCache<ProofMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofMetric | undefined {
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

  save(item: ProofMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofMetric[] {
    return this.inner.list();
  }
}

export function newCachedProofMetricStore(inner: ProofMetricStore, ttl: number, clockValue: clock.Clock): ProofMetricStore {
  return new CachedProofMetricStore(inner, cache.newTtlCache<ProofMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects proof metrics. Empty fields match all. */
export class ProofMetricQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofMetric[]): ProofMetric[] {
    const matched = collections.filter(items, (candidate: ProofMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofMetrics(store: ProofMetricStore, query: ProofMetricQuery): ProofMetric[] {
  return query.apply(store.list());
}
