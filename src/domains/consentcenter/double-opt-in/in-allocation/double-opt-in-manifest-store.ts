import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInManifest } from "./double-opt-in-manifest.js";

/** Keeps double opt in manifests by code. */
export interface DoubleOptInManifestStore {
  find(code: string): DoubleOptInManifest | undefined;
  save(item: DoubleOptInManifest): void;
  remove(code: string): boolean;
  list(): DoubleOptInManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInManifestStore implements DoubleOptInManifestStore {
  items: Map<string, DoubleOptInManifest>;
  order: string[];

  constructor(items: Map<string, DoubleOptInManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInManifest): void {
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

  list(): DoubleOptInManifest[] {
    const out: DoubleOptInManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInManifestStore(): DoubleOptInManifestStore {
  return new MemoryDoubleOptInManifestStore(new Map<string, DoubleOptInManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInManifestStore implements DoubleOptInManifestStore {
  inner: DoubleOptInManifestStore;
  cache: cache.TtlCache<DoubleOptInManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInManifestStore,
    cacheValue: cache.TtlCache<DoubleOptInManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInManifest | undefined {
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

  save(item: DoubleOptInManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInManifest[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInManifestStore(inner: DoubleOptInManifestStore, ttl: number, clockValue: clock.Clock): DoubleOptInManifestStore {
  return new CachedDoubleOptInManifestStore(inner, cache.newTtlCache<DoubleOptInManifest>(128, ttl, clockValue), 0, 0);
}

/** Selects double opt in manifests. Empty fields match all. */
export class DoubleOptInManifestQuery {
  utmSource: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSendAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInManifest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInManifest[]): DoubleOptInManifest[] {
    const matched = collections.filter(items, (candidate: DoubleOptInManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInManifests(store: DoubleOptInManifestStore, query: DoubleOptInManifestQuery): DoubleOptInManifest[] {
  return query.apply(store.list());
}
