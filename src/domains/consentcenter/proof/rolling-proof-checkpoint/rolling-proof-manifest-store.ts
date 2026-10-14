import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingProofManifest } from "./rolling-proof-manifest.js";

/** Keeps rolling proof manifests by code. */
export interface RollingProofManifestStore {
  find(code: string): RollingProofManifest | undefined;
  save(item: RollingProofManifest): void;
  remove(code: string): boolean;
  list(): RollingProofManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingProofManifestStore implements RollingProofManifestStore {
  items: Map<string, RollingProofManifest>;
  order: string[];

  constructor(items: Map<string, RollingProofManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingProofManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingProofManifest): void {
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

  list(): RollingProofManifest[] {
    const out: RollingProofManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingProofManifestStore(): RollingProofManifestStore {
  return new MemoryRollingProofManifestStore(new Map<string, RollingProofManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingProofManifestStore implements RollingProofManifestStore {
  inner: RollingProofManifestStore;
  cache: cache.TtlCache<RollingProofManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingProofManifestStore,
    cacheValue: cache.TtlCache<RollingProofManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingProofManifest | undefined {
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

  save(item: RollingProofManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingProofManifest[] {
    return this.inner.list();
  }
}

export function newCachedRollingProofManifestStore(inner: RollingProofManifestStore, ttl: number, clockValue: clock.Clock): RollingProofManifestStore {
  return new CachedRollingProofManifestStore(
    inner,
    cache.newTtlCache<RollingProofManifest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling proof manifests. Empty fields match all. */
export class RollingProofManifestQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingProofManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingProofManifest[]): RollingProofManifest[] {
    const matched = collections.filter(items, (candidate: RollingProofManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingProofManifests(store: RollingProofManifestStore, query: RollingProofManifestQuery): RollingProofManifest[] {
  return query.apply(store.list());
}
