import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPlacementDigest } from "./default-placement-digest.js";

/** Keeps default placement digests by code. */
export interface DefaultPlacementDigestStore {
  find(code: string): DefaultPlacementDigest | undefined;
  save(item: DefaultPlacementDigest): void;
  remove(code: string): boolean;
  list(): DefaultPlacementDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPlacementDigestStore implements DefaultPlacementDigestStore {
  items: Map<string, DefaultPlacementDigest>;
  order: string[];

  constructor(items: Map<string, DefaultPlacementDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPlacementDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPlacementDigest): void {
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

  list(): DefaultPlacementDigest[] {
    const out: DefaultPlacementDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPlacementDigestStore(): DefaultPlacementDigestStore {
  return new MemoryDefaultPlacementDigestStore(new Map<string, DefaultPlacementDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPlacementDigestStore implements DefaultPlacementDigestStore {
  inner: DefaultPlacementDigestStore;
  cache: cache.TtlCache<DefaultPlacementDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPlacementDigestStore,
    cacheValue: cache.TtlCache<DefaultPlacementDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPlacementDigest | undefined {
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

  save(item: DefaultPlacementDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPlacementDigest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPlacementDigestStore(inner: DefaultPlacementDigestStore, ttl: number, clockValue: clock.Clock): DefaultPlacementDigestStore {
  return new CachedDefaultPlacementDigestStore(
    inner,
    cache.newTtlCache<DefaultPlacementDigest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default placement digests. Empty fields match all. */
export class DefaultPlacementDigestQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPlacementDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPlacementDigest[]): DefaultPlacementDigest[] {
    const matched = collections.filter(items, (candidate: DefaultPlacementDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPlacementDigests(store: DefaultPlacementDigestStore, query: DefaultPlacementDigestQuery): DefaultPlacementDigest[] {
  return query.apply(store.list());
}
