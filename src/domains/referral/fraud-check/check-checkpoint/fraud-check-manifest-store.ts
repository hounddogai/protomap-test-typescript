import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckManifest } from "./fraud-check-manifest.js";

/** Keeps fraud check manifests by code. */
export interface FraudCheckManifestStore {
  find(code: string): FraudCheckManifest | undefined;
  save(item: FraudCheckManifest): void;
  remove(code: string): boolean;
  list(): FraudCheckManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckManifestStore implements FraudCheckManifestStore {
  items: Map<string, FraudCheckManifest>;
  order: string[];

  constructor(items: Map<string, FraudCheckManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckManifest): void {
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

  list(): FraudCheckManifest[] {
    const out: FraudCheckManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckManifestStore(): FraudCheckManifestStore {
  return new MemoryFraudCheckManifestStore(new Map<string, FraudCheckManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckManifestStore implements FraudCheckManifestStore {
  inner: FraudCheckManifestStore;
  cache: cache.TtlCache<FraudCheckManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckManifestStore,
    cacheValue: cache.TtlCache<FraudCheckManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckManifest | undefined {
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

  save(item: FraudCheckManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckManifest[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckManifestStore(inner: FraudCheckManifestStore, ttl: number, clockValue: clock.Clock): FraudCheckManifestStore {
  return new CachedFraudCheckManifestStore(inner, cache.newTtlCache<FraudCheckManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects fraud check manifests. Empty fields match all. */
export class FraudCheckManifestQuery {
  unit: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAttempts: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckManifest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckManifest[]): FraudCheckManifest[] {
    const matched = collections.filter(items, (candidate: FraudCheckManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckManifests(store: FraudCheckManifestStore, query: FraudCheckManifestQuery): FraudCheckManifest[] {
  return query.apply(store.list());
}
