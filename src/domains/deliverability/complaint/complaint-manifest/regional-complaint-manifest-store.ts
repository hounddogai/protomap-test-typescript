import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalComplaintManifest } from "./regional-complaint-manifest.js";

/** Keeps regional complaint manifests by code. */
export interface RegionalComplaintManifestStore {
  find(code: string): RegionalComplaintManifest | undefined;
  save(item: RegionalComplaintManifest): void;
  remove(code: string): boolean;
  list(): RegionalComplaintManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalComplaintManifestStore implements RegionalComplaintManifestStore {
  items: Map<string, RegionalComplaintManifest>;
  order: string[];

  constructor(items: Map<string, RegionalComplaintManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalComplaintManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalComplaintManifest): void {
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

  list(): RegionalComplaintManifest[] {
    const out: RegionalComplaintManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalComplaintManifestStore(): RegionalComplaintManifestStore {
  return new MemoryRegionalComplaintManifestStore(new Map<string, RegionalComplaintManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalComplaintManifestStore implements RegionalComplaintManifestStore {
  inner: RegionalComplaintManifestStore;
  cache: cache.TtlCache<RegionalComplaintManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalComplaintManifestStore,
    cacheValue: cache.TtlCache<RegionalComplaintManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalComplaintManifest | undefined {
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

  save(item: RegionalComplaintManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalComplaintManifest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalComplaintManifestStore(inner: RegionalComplaintManifestStore, ttl: number, clockValue: clock.Clock): RegionalComplaintManifestStore {
  return new CachedRegionalComplaintManifestStore(
    inner,
    cache.newTtlCache<RegionalComplaintManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional complaint manifests. Empty fields match all. */
export class RegionalComplaintManifestQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalComplaintManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalComplaintManifest[]): RegionalComplaintManifest[] {
    const matched = collections.filter(items, (candidate: RegionalComplaintManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalComplaintManifests(store: RegionalComplaintManifestStore, query: RegionalComplaintManifestQuery): RegionalComplaintManifest[] {
  return query.apply(store.list());
}
