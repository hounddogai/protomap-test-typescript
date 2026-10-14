import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSlaDigest } from "./regional-sla-digest.js";

/** Keeps regional sla digests by code. */
export interface RegionalSlaDigestStore {
  find(code: string): RegionalSlaDigest | undefined;
  save(item: RegionalSlaDigest): void;
  remove(code: string): boolean;
  list(): RegionalSlaDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSlaDigestStore implements RegionalSlaDigestStore {
  items: Map<string, RegionalSlaDigest>;
  order: string[];

  constructor(items: Map<string, RegionalSlaDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSlaDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSlaDigest): void {
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

  list(): RegionalSlaDigest[] {
    const out: RegionalSlaDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSlaDigestStore(): RegionalSlaDigestStore {
  return new MemoryRegionalSlaDigestStore(new Map<string, RegionalSlaDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSlaDigestStore implements RegionalSlaDigestStore {
  inner: RegionalSlaDigestStore;
  cache: cache.TtlCache<RegionalSlaDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSlaDigestStore,
    cacheValue: cache.TtlCache<RegionalSlaDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSlaDigest | undefined {
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

  save(item: RegionalSlaDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSlaDigest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSlaDigestStore(inner: RegionalSlaDigestStore, ttl: number, clockValue: clock.Clock): RegionalSlaDigestStore {
  return new CachedRegionalSlaDigestStore(inner, cache.newTtlCache<RegionalSlaDigest>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional sla digests. Empty fields match all. */
export class RegionalSlaDigestQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSlaDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSlaDigest[]): RegionalSlaDigest[] {
    const matched = collections.filter(items, (candidate: RegionalSlaDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSlaDigests(store: RegionalSlaDigestStore, query: RegionalSlaDigestQuery): RegionalSlaDigest[] {
  return query.apply(store.list());
}
