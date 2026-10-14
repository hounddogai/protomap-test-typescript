import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedTouchpointManifest } from "./capped-touchpoint-manifest.js";

/** Keeps capped touchpoint manifests by code. */
export interface CappedTouchpointManifestStore {
  find(code: string): CappedTouchpointManifest | undefined;
  save(item: CappedTouchpointManifest): void;
  remove(code: string): boolean;
  list(): CappedTouchpointManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedTouchpointManifestStore implements CappedTouchpointManifestStore {
  items: Map<string, CappedTouchpointManifest>;
  order: string[];

  constructor(items: Map<string, CappedTouchpointManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedTouchpointManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedTouchpointManifest): void {
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

  list(): CappedTouchpointManifest[] {
    const out: CappedTouchpointManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedTouchpointManifestStore(): CappedTouchpointManifestStore {
  return new MemoryCappedTouchpointManifestStore(new Map<string, CappedTouchpointManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedTouchpointManifestStore implements CappedTouchpointManifestStore {
  inner: CappedTouchpointManifestStore;
  cache: cache.TtlCache<CappedTouchpointManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedTouchpointManifestStore,
    cacheValue: cache.TtlCache<CappedTouchpointManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedTouchpointManifest | undefined {
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

  save(item: CappedTouchpointManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedTouchpointManifest[] {
    return this.inner.list();
  }
}

export function newCachedCappedTouchpointManifestStore(inner: CappedTouchpointManifestStore, ttl: number, clockValue: clock.Clock): CappedTouchpointManifestStore {
  return new CachedCappedTouchpointManifestStore(
    inner,
    cache.newTtlCache<CappedTouchpointManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped touchpoint manifests. Empty fields match all. */
export class CappedTouchpointManifestQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedTouchpointManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedTouchpointManifest[]): CappedTouchpointManifest[] {
    const matched = collections.filter(items, (candidate: CappedTouchpointManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedTouchpointManifests(store: CappedTouchpointManifestStore, query: CappedTouchpointManifestQuery): CappedTouchpointManifest[] {
  return query.apply(store.list());
}
