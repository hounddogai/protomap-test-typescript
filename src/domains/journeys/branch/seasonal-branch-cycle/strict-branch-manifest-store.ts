import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBranchManifest } from "./strict-branch-manifest.js";

/** Keeps strict branch manifests by code. */
export interface StrictBranchManifestStore {
  find(code: string): StrictBranchManifest | undefined;
  save(item: StrictBranchManifest): void;
  remove(code: string): boolean;
  list(): StrictBranchManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBranchManifestStore implements StrictBranchManifestStore {
  items: Map<string, StrictBranchManifest>;
  order: string[];

  constructor(items: Map<string, StrictBranchManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBranchManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBranchManifest): void {
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

  list(): StrictBranchManifest[] {
    const out: StrictBranchManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBranchManifestStore(): StrictBranchManifestStore {
  return new MemoryStrictBranchManifestStore(new Map<string, StrictBranchManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBranchManifestStore implements StrictBranchManifestStore {
  inner: StrictBranchManifestStore;
  cache: cache.TtlCache<StrictBranchManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBranchManifestStore,
    cacheValue: cache.TtlCache<StrictBranchManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBranchManifest | undefined {
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

  save(item: StrictBranchManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBranchManifest[] {
    return this.inner.list();
  }
}

export function newCachedStrictBranchManifestStore(inner: StrictBranchManifestStore, ttl: number, clockValue: clock.Clock): StrictBranchManifestStore {
  return new CachedStrictBranchManifestStore(
    inner,
    cache.newTtlCache<StrictBranchManifest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict branch manifests. Empty fields match all. */
export class StrictBranchManifestQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBranchManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBranchManifest[]): StrictBranchManifest[] {
    const matched = collections.filter(items, (candidate: StrictBranchManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBranchManifests(store: StrictBranchManifestStore, query: StrictBranchManifestQuery): StrictBranchManifest[] {
  return query.apply(store.list());
}
