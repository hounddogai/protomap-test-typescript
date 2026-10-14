import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSlaDigest } from "./manual-sla-digest.js";

/** Keeps manual sla digests by code. */
export interface ManualSlaDigestStore {
  find(code: string): ManualSlaDigest | undefined;
  save(item: ManualSlaDigest): void;
  remove(code: string): boolean;
  list(): ManualSlaDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSlaDigestStore implements ManualSlaDigestStore {
  items: Map<string, ManualSlaDigest>;
  order: string[];

  constructor(items: Map<string, ManualSlaDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSlaDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSlaDigest): void {
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

  list(): ManualSlaDigest[] {
    const out: ManualSlaDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSlaDigestStore(): ManualSlaDigestStore {
  return new MemoryManualSlaDigestStore(new Map<string, ManualSlaDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSlaDigestStore implements ManualSlaDigestStore {
  inner: ManualSlaDigestStore;
  cache: cache.TtlCache<ManualSlaDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSlaDigestStore,
    cacheValue: cache.TtlCache<ManualSlaDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSlaDigest | undefined {
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

  save(item: ManualSlaDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSlaDigest[] {
    return this.inner.list();
  }
}

export function newCachedManualSlaDigestStore(inner: ManualSlaDigestStore, ttl: number, clockValue: clock.Clock): ManualSlaDigestStore {
  return new CachedManualSlaDigestStore(inner, cache.newTtlCache<ManualSlaDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects manual sla digests. Empty fields match all. */
export class ManualSlaDigestQuery {
  utmSource: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minQuantity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSlaDigest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSlaDigest[]): ManualSlaDigest[] {
    const matched = collections.filter(items, (candidate: ManualSlaDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSlaDigests(store: ManualSlaDigestStore, query: ManualSlaDigestQuery): ManualSlaDigest[] {
  return query.apply(store.list());
}
