import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDeflectionManifest } from "./capped-deflection-manifest.js";

/** Keeps capped deflection manifests by code. */
export interface CappedDeflectionManifestStore {
  find(code: string): CappedDeflectionManifest | undefined;
  save(item: CappedDeflectionManifest): void;
  remove(code: string): boolean;
  list(): CappedDeflectionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDeflectionManifestStore implements CappedDeflectionManifestStore {
  items: Map<string, CappedDeflectionManifest>;
  order: string[];

  constructor(items: Map<string, CappedDeflectionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDeflectionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDeflectionManifest): void {
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

  list(): CappedDeflectionManifest[] {
    const out: CappedDeflectionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDeflectionManifestStore(): CappedDeflectionManifestStore {
  return new MemoryCappedDeflectionManifestStore(new Map<string, CappedDeflectionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDeflectionManifestStore implements CappedDeflectionManifestStore {
  inner: CappedDeflectionManifestStore;
  cache: cache.TtlCache<CappedDeflectionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDeflectionManifestStore,
    cacheValue: cache.TtlCache<CappedDeflectionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDeflectionManifest | undefined {
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

  save(item: CappedDeflectionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDeflectionManifest[] {
    return this.inner.list();
  }
}

export function newCachedCappedDeflectionManifestStore(inner: CappedDeflectionManifestStore, ttl: number, clockValue: clock.Clock): CappedDeflectionManifestStore {
  return new CachedCappedDeflectionManifestStore(
    inner,
    cache.newTtlCache<CappedDeflectionManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped deflection manifests. Empty fields match all. */
export class CappedDeflectionManifestQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDeflectionManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDeflectionManifest[]): CappedDeflectionManifest[] {
    const matched = collections.filter(items, (candidate: CappedDeflectionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDeflectionManifests(store: CappedDeflectionManifestStore, query: CappedDeflectionManifestQuery): CappedDeflectionManifest[] {
  return query.apply(store.list());
}
