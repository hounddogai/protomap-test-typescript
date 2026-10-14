import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentManifest } from "./enrollment-manifest.js";

/** Keeps enrollment manifests by code. */
export interface EnrollmentManifestStore {
  find(code: string): EnrollmentManifest | undefined;
  save(item: EnrollmentManifest): void;
  remove(code: string): boolean;
  list(): EnrollmentManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentManifestStore implements EnrollmentManifestStore {
  items: Map<string, EnrollmentManifest>;
  order: string[];

  constructor(items: Map<string, EnrollmentManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentManifest): void {
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

  list(): EnrollmentManifest[] {
    const out: EnrollmentManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentManifestStore(): EnrollmentManifestStore {
  return new MemoryEnrollmentManifestStore(new Map<string, EnrollmentManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentManifestStore implements EnrollmentManifestStore {
  inner: EnrollmentManifestStore;
  cache: cache.TtlCache<EnrollmentManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentManifestStore,
    cacheValue: cache.TtlCache<EnrollmentManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentManifest | undefined {
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

  save(item: EnrollmentManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentManifest[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentManifestStore(inner: EnrollmentManifestStore, ttl: number, clockValue: clock.Clock): EnrollmentManifestStore {
  return new CachedEnrollmentManifestStore(inner, cache.newTtlCache<EnrollmentManifest>(64, ttl, clockValue), 0, 0);
}

/** Selects enrollment manifests. Empty fields match all. */
export class EnrollmentManifestQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentManifest[]): EnrollmentManifest[] {
    const matched = collections.filter(items, (candidate: EnrollmentManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentManifests(store: EnrollmentManifestStore, query: EnrollmentManifestQuery): EnrollmentManifest[] {
  return query.apply(store.list());
}
