import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyManifest } from "./journey-manifest.js";

/** Keeps journey manifests by code. */
export interface JourneyManifestStore {
  find(code: string): JourneyManifest | undefined;
  save(item: JourneyManifest): void;
  remove(code: string): boolean;
  list(): JourneyManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyManifestStore implements JourneyManifestStore {
  items: Map<string, JourneyManifest>;
  order: string[];

  constructor(items: Map<string, JourneyManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyManifest): void {
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

  list(): JourneyManifest[] {
    const out: JourneyManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyManifestStore(): JourneyManifestStore {
  return new MemoryJourneyManifestStore(new Map<string, JourneyManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyManifestStore implements JourneyManifestStore {
  inner: JourneyManifestStore;
  cache: cache.TtlCache<JourneyManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneyManifestStore,
    cacheValue: cache.TtlCache<JourneyManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyManifest | undefined {
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

  save(item: JourneyManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyManifest[] {
    return this.inner.list();
  }
}

export function newCachedJourneyManifestStore(inner: JourneyManifestStore, ttl: number, clockValue: clock.Clock): JourneyManifestStore {
  return new CachedJourneyManifestStore(inner, cache.newTtlCache<JourneyManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects journey manifests. Empty fields match all. */
export class JourneyManifestQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyManifest[]): JourneyManifest[] {
    const matched = collections.filter(items, (candidate: JourneyManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyManifests(store: JourneyManifestStore, query: JourneyManifestQuery): JourneyManifest[] {
  return query.apply(store.list());
}
