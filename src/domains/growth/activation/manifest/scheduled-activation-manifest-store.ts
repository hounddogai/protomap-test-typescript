import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledActivationManifest } from "./scheduled-activation-manifest.js";

/** Keeps scheduled activation manifests by code. */
export interface ScheduledActivationManifestStore {
  find(code: string): ScheduledActivationManifest | undefined;
  save(item: ScheduledActivationManifest): void;
  remove(code: string): boolean;
  list(): ScheduledActivationManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledActivationManifestStore implements ScheduledActivationManifestStore {
  items: Map<string, ScheduledActivationManifest>;
  order: string[];

  constructor(items: Map<string, ScheduledActivationManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledActivationManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledActivationManifest): void {
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

  list(): ScheduledActivationManifest[] {
    const out: ScheduledActivationManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledActivationManifestStore(): ScheduledActivationManifestStore {
  return new MemoryScheduledActivationManifestStore(new Map<string, ScheduledActivationManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledActivationManifestStore implements ScheduledActivationManifestStore {
  inner: ScheduledActivationManifestStore;
  cache: cache.TtlCache<ScheduledActivationManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledActivationManifestStore,
    cacheValue: cache.TtlCache<ScheduledActivationManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledActivationManifest | undefined {
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

  save(item: ScheduledActivationManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledActivationManifest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledActivationManifestStore(inner: ScheduledActivationManifestStore, ttl: number, clockValue: clock.Clock): ScheduledActivationManifestStore {
  return new CachedScheduledActivationManifestStore(
    inner,
    cache.newTtlCache<ScheduledActivationManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled activation manifests. Empty fields match all. */
export class ScheduledActivationManifestQuery {
  segment: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMinimum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledActivationManifest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledActivationManifest[]): ScheduledActivationManifest[] {
    const matched = collections.filter(items, (candidate: ScheduledActivationManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledActivationManifests(store: ScheduledActivationManifestStore, query: ScheduledActivationManifestQuery): ScheduledActivationManifest[] {
  return query.apply(store.list());
}
