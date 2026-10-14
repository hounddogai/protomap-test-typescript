import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFrequencyManifest } from "./manual-frequency-manifest.js";

/** Keeps manual frequency manifests by code. */
export interface ManualFrequencyManifestStore {
  find(code: string): ManualFrequencyManifest | undefined;
  save(item: ManualFrequencyManifest): void;
  remove(code: string): boolean;
  list(): ManualFrequencyManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFrequencyManifestStore implements ManualFrequencyManifestStore {
  items: Map<string, ManualFrequencyManifest>;
  order: string[];

  constructor(items: Map<string, ManualFrequencyManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFrequencyManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFrequencyManifest): void {
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

  list(): ManualFrequencyManifest[] {
    const out: ManualFrequencyManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFrequencyManifestStore(): ManualFrequencyManifestStore {
  return new MemoryManualFrequencyManifestStore(new Map<string, ManualFrequencyManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFrequencyManifestStore implements ManualFrequencyManifestStore {
  inner: ManualFrequencyManifestStore;
  cache: cache.TtlCache<ManualFrequencyManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFrequencyManifestStore,
    cacheValue: cache.TtlCache<ManualFrequencyManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFrequencyManifest | undefined {
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

  save(item: ManualFrequencyManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFrequencyManifest[] {
    return this.inner.list();
  }
}

export function newCachedManualFrequencyManifestStore(inner: ManualFrequencyManifestStore, ttl: number, clockValue: clock.Clock): ManualFrequencyManifestStore {
  return new CachedManualFrequencyManifestStore(
    inner,
    cache.newTtlCache<ManualFrequencyManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual frequency manifests. Empty fields match all. */
export class ManualFrequencyManifestQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualFrequencyManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFrequencyManifest[]): ManualFrequencyManifest[] {
    const matched = collections.filter(items, (candidate: ManualFrequencyManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFrequencyManifests(store: ManualFrequencyManifestStore, query: ManualFrequencyManifestQuery): ManualFrequencyManifest[] {
  return query.apply(store.list());
}
