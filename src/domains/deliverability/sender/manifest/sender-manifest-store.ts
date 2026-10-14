import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderManifest } from "./sender-manifest.js";

/** Keeps sender manifests by code. */
export interface SenderManifestStore {
  find(code: string): SenderManifest | undefined;
  save(item: SenderManifest): void;
  remove(code: string): boolean;
  list(): SenderManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderManifestStore implements SenderManifestStore {
  items: Map<string, SenderManifest>;
  order: string[];

  constructor(items: Map<string, SenderManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderManifest): void {
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

  list(): SenderManifest[] {
    const out: SenderManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderManifestStore(): SenderManifestStore {
  return new MemorySenderManifestStore(new Map<string, SenderManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderManifestStore implements SenderManifestStore {
  inner: SenderManifestStore;
  cache: cache.TtlCache<SenderManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderManifestStore,
    cacheValue: cache.TtlCache<SenderManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderManifest | undefined {
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

  save(item: SenderManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderManifest[] {
    return this.inner.list();
  }
}

export function newCachedSenderManifestStore(inner: SenderManifestStore, ttl: number, clockValue: clock.Clock): SenderManifestStore {
  return new CachedSenderManifestStore(inner, cache.newTtlCache<SenderManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects sender manifests. Empty fields match all. */
export class SenderManifestQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderManifest[]): SenderManifest[] {
    const matched = collections.filter(items, (candidate: SenderManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderManifests(store: SenderManifestStore, query: SenderManifestQuery): SenderManifest[] {
  return query.apply(store.list());
}
