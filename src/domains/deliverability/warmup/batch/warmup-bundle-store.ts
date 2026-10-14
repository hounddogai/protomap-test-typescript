import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupBundle } from "./warmup-bundle.js";

/** Keeps warmup bundles by code. */
export interface WarmupBundleStore {
  find(code: string): WarmupBundle | undefined;
  save(item: WarmupBundle): void;
  remove(code: string): boolean;
  list(): WarmupBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupBundleStore implements WarmupBundleStore {
  items: Map<string, WarmupBundle>;
  order: string[];

  constructor(items: Map<string, WarmupBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupBundle): void {
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

  list(): WarmupBundle[] {
    const out: WarmupBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupBundleStore(): WarmupBundleStore {
  return new MemoryWarmupBundleStore(new Map<string, WarmupBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupBundleStore implements WarmupBundleStore {
  inner: WarmupBundleStore;
  cache: cache.TtlCache<WarmupBundle>;
  hits: number;
  misses: number;

  constructor(inner: WarmupBundleStore, cacheValue: cache.TtlCache<WarmupBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupBundle | undefined {
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

  save(item: WarmupBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupBundle[] {
    return this.inner.list();
  }
}

export function newCachedWarmupBundleStore(inner: WarmupBundleStore, ttl: number, clockValue: clock.Clock): WarmupBundleStore {
  return new CachedWarmupBundleStore(inner, cache.newTtlCache<WarmupBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup bundles. Empty fields match all. */
export class WarmupBundleQuery {
  segment: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minEndsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupBundle): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupBundle[]): WarmupBundle[] {
    const matched = collections.filter(items, (candidate: WarmupBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupBundles(store: WarmupBundleStore, query: WarmupBundleQuery): WarmupBundle[] {
  return query.apply(store.list());
}
