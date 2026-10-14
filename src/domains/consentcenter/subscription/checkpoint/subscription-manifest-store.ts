import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionManifest } from "./subscription-manifest.js";

/** Keeps subscription manifests by code. */
export interface SubscriptionManifestStore {
  find(code: string): SubscriptionManifest | undefined;
  save(item: SubscriptionManifest): void;
  remove(code: string): boolean;
  list(): SubscriptionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionManifestStore implements SubscriptionManifestStore {
  items: Map<string, SubscriptionManifest>;
  order: string[];

  constructor(items: Map<string, SubscriptionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionManifest): void {
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

  list(): SubscriptionManifest[] {
    const out: SubscriptionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionManifestStore(): SubscriptionManifestStore {
  return new MemorySubscriptionManifestStore(new Map<string, SubscriptionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionManifestStore implements SubscriptionManifestStore {
  inner: SubscriptionManifestStore;
  cache: cache.TtlCache<SubscriptionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionManifestStore,
    cacheValue: cache.TtlCache<SubscriptionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionManifest | undefined {
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

  save(item: SubscriptionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionManifest[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionManifestStore(inner: SubscriptionManifestStore, ttl: number, clockValue: clock.Clock): SubscriptionManifestStore {
  return new CachedSubscriptionManifestStore(
    inner,
    cache.newTtlCache<SubscriptionManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription manifests. Empty fields match all. */
export class SubscriptionManifestQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionManifest[]): SubscriptionManifest[] {
    const matched = collections.filter(items, (candidate: SubscriptionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionManifests(store: SubscriptionManifestStore, query: SubscriptionManifestQuery): SubscriptionManifest[] {
  return query.apply(store.list());
}
