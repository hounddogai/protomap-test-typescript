import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchManifest } from "./branch-manifest.js";

/** Keeps branch manifests by code. */
export interface BranchManifestStore {
  find(code: string): BranchManifest | undefined;
  save(item: BranchManifest): void;
  remove(code: string): boolean;
  list(): BranchManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchManifestStore implements BranchManifestStore {
  items: Map<string, BranchManifest>;
  order: string[];

  constructor(items: Map<string, BranchManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchManifest): void {
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

  list(): BranchManifest[] {
    const out: BranchManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchManifestStore(): BranchManifestStore {
  return new MemoryBranchManifestStore(new Map<string, BranchManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchManifestStore implements BranchManifestStore {
  inner: BranchManifestStore;
  cache: cache.TtlCache<BranchManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchManifestStore,
    cacheValue: cache.TtlCache<BranchManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchManifest | undefined {
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

  save(item: BranchManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchManifest[] {
    return this.inner.list();
  }
}

export function newCachedBranchManifestStore(inner: BranchManifestStore, ttl: number, clockValue: clock.Clock): BranchManifestStore {
  return new CachedBranchManifestStore(inner, cache.newTtlCache<BranchManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects branch manifests. Empty fields match all. */
export class BranchManifestQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchManifest[]): BranchManifest[] {
    const matched = collections.filter(items, (candidate: BranchManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchManifests(store: BranchManifestStore, query: BranchManifestQuery): BranchManifest[] {
  return query.apply(store.list());
}
