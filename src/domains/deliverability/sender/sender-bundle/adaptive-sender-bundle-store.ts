import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSenderBundle } from "./adaptive-sender-bundle.js";

/** Keeps adaptive sender bundles by code. */
export interface AdaptiveSenderBundleStore {
  find(code: string): AdaptiveSenderBundle | undefined;
  save(item: AdaptiveSenderBundle): void;
  remove(code: string): boolean;
  list(): AdaptiveSenderBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSenderBundleStore implements AdaptiveSenderBundleStore {
  items: Map<string, AdaptiveSenderBundle>;
  order: string[];

  constructor(items: Map<string, AdaptiveSenderBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSenderBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSenderBundle): void {
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

  list(): AdaptiveSenderBundle[] {
    const out: AdaptiveSenderBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSenderBundleStore(): AdaptiveSenderBundleStore {
  return new MemoryAdaptiveSenderBundleStore(new Map<string, AdaptiveSenderBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSenderBundleStore implements AdaptiveSenderBundleStore {
  inner: AdaptiveSenderBundleStore;
  cache: cache.TtlCache<AdaptiveSenderBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSenderBundleStore,
    cacheValue: cache.TtlCache<AdaptiveSenderBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSenderBundle | undefined {
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

  save(item: AdaptiveSenderBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSenderBundle[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSenderBundleStore(inner: AdaptiveSenderBundleStore, ttl: number, clockValue: clock.Clock): AdaptiveSenderBundleStore {
  return new CachedAdaptiveSenderBundleStore(
    inner,
    cache.newTtlCache<AdaptiveSenderBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive sender bundles. Empty fields match all. */
export class AdaptiveSenderBundleQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSenderBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSenderBundle[]): AdaptiveSenderBundle[] {
    const matched = collections.filter(items, (candidate: AdaptiveSenderBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSenderBundles(store: AdaptiveSenderBundleStore, query: AdaptiveSenderBundleQuery): AdaptiveSenderBundle[] {
  return query.apply(store.list());
}
