import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPlacementDigest } from "./lenient-placement-digest.js";

/** Keeps lenient placement digests by code. */
export interface LenientPlacementDigestStore {
  find(code: string): LenientPlacementDigest | undefined;
  save(item: LenientPlacementDigest): void;
  remove(code: string): boolean;
  list(): LenientPlacementDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPlacementDigestStore implements LenientPlacementDigestStore {
  items: Map<string, LenientPlacementDigest>;
  order: string[];

  constructor(items: Map<string, LenientPlacementDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPlacementDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPlacementDigest): void {
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

  list(): LenientPlacementDigest[] {
    const out: LenientPlacementDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPlacementDigestStore(): LenientPlacementDigestStore {
  return new MemoryLenientPlacementDigestStore(new Map<string, LenientPlacementDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPlacementDigestStore implements LenientPlacementDigestStore {
  inner: LenientPlacementDigestStore;
  cache: cache.TtlCache<LenientPlacementDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPlacementDigestStore,
    cacheValue: cache.TtlCache<LenientPlacementDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPlacementDigest | undefined {
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

  save(item: LenientPlacementDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPlacementDigest[] {
    return this.inner.list();
  }
}

export function newCachedLenientPlacementDigestStore(inner: LenientPlacementDigestStore, ttl: number, clockValue: clock.Clock): LenientPlacementDigestStore {
  return new CachedLenientPlacementDigestStore(
    inner,
    cache.newTtlCache<LenientPlacementDigest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient placement digests. Empty fields match all. */
export class LenientPlacementDigestQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPlacementDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPlacementDigest[]): LenientPlacementDigest[] {
    const matched = collections.filter(items, (candidate: LenientPlacementDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPlacementDigests(store: LenientPlacementDigestStore, query: LenientPlacementDigestQuery): LenientPlacementDigest[] {
  return query.apply(store.list());
}
