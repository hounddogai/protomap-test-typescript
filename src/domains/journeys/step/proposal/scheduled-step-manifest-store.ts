import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledStepManifest } from "./scheduled-step-manifest.js";

/** Keeps scheduled step manifests by code. */
export interface ScheduledStepManifestStore {
  find(code: string): ScheduledStepManifest | undefined;
  save(item: ScheduledStepManifest): void;
  remove(code: string): boolean;
  list(): ScheduledStepManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledStepManifestStore implements ScheduledStepManifestStore {
  items: Map<string, ScheduledStepManifest>;
  order: string[];

  constructor(items: Map<string, ScheduledStepManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledStepManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledStepManifest): void {
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

  list(): ScheduledStepManifest[] {
    const out: ScheduledStepManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledStepManifestStore(): ScheduledStepManifestStore {
  return new MemoryScheduledStepManifestStore(new Map<string, ScheduledStepManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledStepManifestStore implements ScheduledStepManifestStore {
  inner: ScheduledStepManifestStore;
  cache: cache.TtlCache<ScheduledStepManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledStepManifestStore,
    cacheValue: cache.TtlCache<ScheduledStepManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledStepManifest | undefined {
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

  save(item: ScheduledStepManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledStepManifest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledStepManifestStore(inner: ScheduledStepManifestStore, ttl: number, clockValue: clock.Clock): ScheduledStepManifestStore {
  return new CachedScheduledStepManifestStore(
    inner,
    cache.newTtlCache<ScheduledStepManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled step manifests. Empty fields match all. */
export class ScheduledStepManifestQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledStepManifest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledStepManifest[]): ScheduledStepManifest[] {
    const matched = collections.filter(items, (candidate: ScheduledStepManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledStepManifests(store: ScheduledStepManifestStore, query: ScheduledStepManifestQuery): ScheduledStepManifest[] {
  return query.apply(store.list());
}
