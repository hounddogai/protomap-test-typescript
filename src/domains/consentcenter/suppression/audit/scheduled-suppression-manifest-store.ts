import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSuppressionManifest } from "./scheduled-suppression-manifest.js";

/** Keeps scheduled suppression manifests by code. */
export interface ScheduledSuppressionManifestStore {
  find(code: string): ScheduledSuppressionManifest | undefined;
  save(item: ScheduledSuppressionManifest): void;
  remove(code: string): boolean;
  list(): ScheduledSuppressionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSuppressionManifestStore implements ScheduledSuppressionManifestStore {
  items: Map<string, ScheduledSuppressionManifest>;
  order: string[];

  constructor(items: Map<string, ScheduledSuppressionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSuppressionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSuppressionManifest): void {
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

  list(): ScheduledSuppressionManifest[] {
    const out: ScheduledSuppressionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSuppressionManifestStore(): ScheduledSuppressionManifestStore {
  return new MemoryScheduledSuppressionManifestStore(new Map<string, ScheduledSuppressionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSuppressionManifestStore implements ScheduledSuppressionManifestStore {
  inner: ScheduledSuppressionManifestStore;
  cache: cache.TtlCache<ScheduledSuppressionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSuppressionManifestStore,
    cacheValue: cache.TtlCache<ScheduledSuppressionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSuppressionManifest | undefined {
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

  save(item: ScheduledSuppressionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSuppressionManifest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSuppressionManifestStore(inner: ScheduledSuppressionManifestStore, ttl: number, clockValue: clock.Clock): ScheduledSuppressionManifestStore {
  return new CachedScheduledSuppressionManifestStore(
    inner,
    cache.newTtlCache<ScheduledSuppressionManifest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled suppression manifests. Empty fields match all. */
export class ScheduledSuppressionManifestQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSuppressionManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSuppressionManifest[]): ScheduledSuppressionManifest[] {
    const matched = collections.filter(items, (candidate: ScheduledSuppressionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSuppressionManifests(store: ScheduledSuppressionManifestStore, query: ScheduledSuppressionManifestQuery): ScheduledSuppressionManifest[] {
  return query.apply(store.list());
}
