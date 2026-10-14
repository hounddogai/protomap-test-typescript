import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPaywallManifest } from "./primary-paywall-manifest.js";

/** Keeps primary paywall manifests by code. */
export interface PrimaryPaywallManifestStore {
  find(code: string): PrimaryPaywallManifest | undefined;
  save(item: PrimaryPaywallManifest): void;
  remove(code: string): boolean;
  list(): PrimaryPaywallManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPaywallManifestStore implements PrimaryPaywallManifestStore {
  items: Map<string, PrimaryPaywallManifest>;
  order: string[];

  constructor(items: Map<string, PrimaryPaywallManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPaywallManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPaywallManifest): void {
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

  list(): PrimaryPaywallManifest[] {
    const out: PrimaryPaywallManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPaywallManifestStore(): PrimaryPaywallManifestStore {
  return new MemoryPrimaryPaywallManifestStore(new Map<string, PrimaryPaywallManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPaywallManifestStore implements PrimaryPaywallManifestStore {
  inner: PrimaryPaywallManifestStore;
  cache: cache.TtlCache<PrimaryPaywallManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPaywallManifestStore,
    cacheValue: cache.TtlCache<PrimaryPaywallManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPaywallManifest | undefined {
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

  save(item: PrimaryPaywallManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPaywallManifest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPaywallManifestStore(inner: PrimaryPaywallManifestStore, ttl: number, clockValue: clock.Clock): PrimaryPaywallManifestStore {
  return new CachedPrimaryPaywallManifestStore(
    inner,
    cache.newTtlCache<PrimaryPaywallManifest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary paywall manifests. Empty fields match all. */
export class PrimaryPaywallManifestQuery {
  segment: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minClicks: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPaywallManifest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPaywallManifest[]): PrimaryPaywallManifest[] {
    const matched = collections.filter(items, (candidate: PrimaryPaywallManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPaywallManifests(store: PrimaryPaywallManifestStore, query: PrimaryPaywallManifestQuery): PrimaryPaywallManifest[] {
  return query.apply(store.list());
}
