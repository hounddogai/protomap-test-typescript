import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

/** Keeps scheduled funnel manifests by code. */
export interface ScheduledFunnelManifestStore {
  find(code: string): ScheduledFunnelManifest | undefined;
  save(item: ScheduledFunnelManifest): void;
  remove(code: string): boolean;
  list(): ScheduledFunnelManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFunnelManifestStore implements ScheduledFunnelManifestStore {
  items: Map<string, ScheduledFunnelManifest>;
  order: string[];

  constructor(items: Map<string, ScheduledFunnelManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFunnelManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFunnelManifest): void {
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

  list(): ScheduledFunnelManifest[] {
    const out: ScheduledFunnelManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFunnelManifestStore(): ScheduledFunnelManifestStore {
  return new MemoryScheduledFunnelManifestStore(new Map<string, ScheduledFunnelManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFunnelManifestStore implements ScheduledFunnelManifestStore {
  inner: ScheduledFunnelManifestStore;
  cache: cache.TtlCache<ScheduledFunnelManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFunnelManifestStore,
    cacheValue: cache.TtlCache<ScheduledFunnelManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFunnelManifest | undefined {
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

  save(item: ScheduledFunnelManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFunnelManifest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFunnelManifestStore(inner: ScheduledFunnelManifestStore, ttl: number, clockValue: clock.Clock): ScheduledFunnelManifestStore {
  return new CachedScheduledFunnelManifestStore(
    inner,
    cache.newTtlCache<ScheduledFunnelManifest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled funnel manifests. Empty fields match all. */
export class ScheduledFunnelManifestQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFunnelManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFunnelManifest[]): ScheduledFunnelManifest[] {
    const matched = collections.filter(items, (candidate: ScheduledFunnelManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFunnelManifests(store: ScheduledFunnelManifestStore, query: ScheduledFunnelManifestQuery): ScheduledFunnelManifest[] {
  return query.apply(store.list());
}
