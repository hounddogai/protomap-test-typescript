import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionManifest } from "./redemption-manifest.js";

/** Keeps redemption manifests by code. */
export interface RedemptionManifestStore {
  find(code: string): RedemptionManifest | undefined;
  save(item: RedemptionManifest): void;
  remove(code: string): boolean;
  list(): RedemptionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionManifestStore implements RedemptionManifestStore {
  items: Map<string, RedemptionManifest>;
  order: string[];

  constructor(items: Map<string, RedemptionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionManifest): void {
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

  list(): RedemptionManifest[] {
    const out: RedemptionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionManifestStore(): RedemptionManifestStore {
  return new MemoryRedemptionManifestStore(new Map<string, RedemptionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionManifestStore implements RedemptionManifestStore {
  inner: RedemptionManifestStore;
  cache: cache.TtlCache<RedemptionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionManifestStore,
    cacheValue: cache.TtlCache<RedemptionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionManifest | undefined {
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

  save(item: RedemptionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionManifest[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionManifestStore(inner: RedemptionManifestStore, ttl: number, clockValue: clock.Clock): RedemptionManifestStore {
  return new CachedRedemptionManifestStore(inner, cache.newTtlCache<RedemptionManifest>(128, ttl, clockValue), 0, 0);
}

/** Selects redemption manifests. Empty fields match all. */
export class RedemptionManifestQuery {
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

  matches(item: RedemptionManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionManifest[]): RedemptionManifest[] {
    const matched = collections.filter(items, (candidate: RedemptionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionManifests(store: RedemptionManifestStore, query: RedemptionManifestQuery): RedemptionManifest[] {
  return query.apply(store.list());
}
