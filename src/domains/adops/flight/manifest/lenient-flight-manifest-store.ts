import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFlightManifest } from "./lenient-flight-manifest.js";

/** Keeps lenient flight manifests by code. */
export interface LenientFlightManifestStore {
  find(code: string): LenientFlightManifest | undefined;
  save(item: LenientFlightManifest): void;
  remove(code: string): boolean;
  list(): LenientFlightManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFlightManifestStore implements LenientFlightManifestStore {
  items: Map<string, LenientFlightManifest>;
  order: string[];

  constructor(items: Map<string, LenientFlightManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFlightManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFlightManifest): void {
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

  list(): LenientFlightManifest[] {
    const out: LenientFlightManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFlightManifestStore(): LenientFlightManifestStore {
  return new MemoryLenientFlightManifestStore(new Map<string, LenientFlightManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFlightManifestStore implements LenientFlightManifestStore {
  inner: LenientFlightManifestStore;
  cache: cache.TtlCache<LenientFlightManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFlightManifestStore,
    cacheValue: cache.TtlCache<LenientFlightManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFlightManifest | undefined {
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

  save(item: LenientFlightManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFlightManifest[] {
    return this.inner.list();
  }
}

export function newCachedLenientFlightManifestStore(inner: LenientFlightManifestStore, ttl: number, clockValue: clock.Clock): LenientFlightManifestStore {
  return new CachedLenientFlightManifestStore(
    inner,
    cache.newTtlCache<LenientFlightManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient flight manifests. Empty fields match all. */
export class LenientFlightManifestQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientFlightManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFlightManifest[]): LenientFlightManifest[] {
    const matched = collections.filter(items, (candidate: LenientFlightManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFlightManifests(store: LenientFlightManifestStore, query: LenientFlightManifestQuery): LenientFlightManifest[] {
  return query.apply(store.list());
}
