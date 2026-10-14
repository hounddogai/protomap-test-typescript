import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaDigest } from "./sla-digest.js";

/** Keeps sla digests by code. */
export interface SlaDigestStore {
  find(code: string): SlaDigest | undefined;
  save(item: SlaDigest): void;
  remove(code: string): boolean;
  list(): SlaDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaDigestStore implements SlaDigestStore {
  items: Map<string, SlaDigest>;
  order: string[];

  constructor(items: Map<string, SlaDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaDigest): void {
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

  list(): SlaDigest[] {
    const out: SlaDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaDigestStore(): SlaDigestStore {
  return new MemorySlaDigestStore(new Map<string, SlaDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaDigestStore implements SlaDigestStore {
  inner: SlaDigestStore;
  cache: cache.TtlCache<SlaDigest>;
  hits: number;
  misses: number;

  constructor(inner: SlaDigestStore, cacheValue: cache.TtlCache<SlaDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaDigest | undefined {
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

  save(item: SlaDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaDigest[] {
    return this.inner.list();
  }
}

export function newCachedSlaDigestStore(inner: SlaDigestStore, ttl: number, clockValue: clock.Clock): SlaDigestStore {
  return new CachedSlaDigestStore(inner, cache.newTtlCache<SlaDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects sla digests. Empty fields match all. */
export class SlaDigestQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaDigest[]): SlaDigest[] {
    const matched = collections.filter(items, (candidate: SlaDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaDigests(store: SlaDigestStore, query: SlaDigestQuery): SlaDigest[] {
  return query.apply(store.list());
}
