import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBadgeManifest } from "./regional-badge-manifest.js";

/** Keeps regional badge manifests by code. */
export interface RegionalBadgeManifestStore {
  find(code: string): RegionalBadgeManifest | undefined;
  save(item: RegionalBadgeManifest): void;
  remove(code: string): boolean;
  list(): RegionalBadgeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBadgeManifestStore implements RegionalBadgeManifestStore {
  items: Map<string, RegionalBadgeManifest>;
  order: string[];

  constructor(items: Map<string, RegionalBadgeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBadgeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBadgeManifest): void {
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

  list(): RegionalBadgeManifest[] {
    const out: RegionalBadgeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBadgeManifestStore(): RegionalBadgeManifestStore {
  return new MemoryRegionalBadgeManifestStore(new Map<string, RegionalBadgeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBadgeManifestStore implements RegionalBadgeManifestStore {
  inner: RegionalBadgeManifestStore;
  cache: cache.TtlCache<RegionalBadgeManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBadgeManifestStore,
    cacheValue: cache.TtlCache<RegionalBadgeManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBadgeManifest | undefined {
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

  save(item: RegionalBadgeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBadgeManifest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBadgeManifestStore(inner: RegionalBadgeManifestStore, ttl: number, clockValue: clock.Clock): RegionalBadgeManifestStore {
  return new CachedRegionalBadgeManifestStore(
    inner,
    cache.newTtlCache<RegionalBadgeManifest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional badge manifests. Empty fields match all. */
export class RegionalBadgeManifestQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalBadgeManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBadgeManifest[]): RegionalBadgeManifest[] {
    const matched = collections.filter(items, (candidate: RegionalBadgeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBadgeManifests(store: RegionalBadgeManifestStore, query: RegionalBadgeManifestQuery): RegionalBadgeManifest[] {
  return query.apply(store.list());
}
