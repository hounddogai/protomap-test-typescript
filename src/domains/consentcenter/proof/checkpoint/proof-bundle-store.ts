import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofBundle } from "./proof-bundle.js";

/** Keeps proof bundles by code. */
export interface ProofBundleStore {
  find(code: string): ProofBundle | undefined;
  save(item: ProofBundle): void;
  remove(code: string): boolean;
  list(): ProofBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofBundleStore implements ProofBundleStore {
  items: Map<string, ProofBundle>;
  order: string[];

  constructor(items: Map<string, ProofBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofBundle): void {
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

  list(): ProofBundle[] {
    const out: ProofBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofBundleStore(): ProofBundleStore {
  return new MemoryProofBundleStore(new Map<string, ProofBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofBundleStore implements ProofBundleStore {
  inner: ProofBundleStore;
  cache: cache.TtlCache<ProofBundle>;
  hits: number;
  misses: number;

  constructor(inner: ProofBundleStore, cacheValue: cache.TtlCache<ProofBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofBundle | undefined {
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

  save(item: ProofBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofBundle[] {
    return this.inner.list();
  }
}

export function newCachedProofBundleStore(inner: ProofBundleStore, ttl: number, clockValue: clock.Clock): ProofBundleStore {
  return new CachedProofBundleStore(inner, cache.newTtlCache<ProofBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects proof bundles. Empty fields match all. */
export class ProofBundleQuery {
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

  matches(item: ProofBundle): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofBundle[]): ProofBundle[] {
    const matched = collections.filter(items, (candidate: ProofBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofBundles(store: ProofBundleStore, query: ProofBundleQuery): ProofBundle[] {
  return query.apply(store.list());
}
