import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintBundle } from "./adaptive-complaint-bundle.js";

/** Keeps adaptive complaint bundles by code. */
export interface AdaptiveComplaintBundleStore {
  find(code: string): AdaptiveComplaintBundle | undefined;
  save(item: AdaptiveComplaintBundle): void;
  remove(code: string): boolean;
  list(): AdaptiveComplaintBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveComplaintBundleStore implements AdaptiveComplaintBundleStore {
  items: Map<string, AdaptiveComplaintBundle>;
  order: string[];

  constructor(items: Map<string, AdaptiveComplaintBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveComplaintBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveComplaintBundle): void {
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

  list(): AdaptiveComplaintBundle[] {
    const out: AdaptiveComplaintBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveComplaintBundleStore(): AdaptiveComplaintBundleStore {
  return new MemoryAdaptiveComplaintBundleStore(new Map<string, AdaptiveComplaintBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveComplaintBundleStore implements AdaptiveComplaintBundleStore {
  inner: AdaptiveComplaintBundleStore;
  cache: cache.TtlCache<AdaptiveComplaintBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveComplaintBundleStore,
    cacheValue: cache.TtlCache<AdaptiveComplaintBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveComplaintBundle | undefined {
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

  save(item: AdaptiveComplaintBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveComplaintBundle[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveComplaintBundleStore(inner: AdaptiveComplaintBundleStore, ttl: number, clockValue: clock.Clock): AdaptiveComplaintBundleStore {
  return new CachedAdaptiveComplaintBundleStore(
    inner,
    cache.newTtlCache<AdaptiveComplaintBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive complaint bundles. Empty fields match all. */
export class AdaptiveComplaintBundleQuery {
  channel: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWindowDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveComplaintBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveComplaintBundle[]): AdaptiveComplaintBundle[] {
    const matched = collections.filter(items, (candidate: AdaptiveComplaintBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveComplaintBundles(store: AdaptiveComplaintBundleStore, query: AdaptiveComplaintBundleQuery): AdaptiveComplaintBundle[] {
  return query.apply(store.list());
}
