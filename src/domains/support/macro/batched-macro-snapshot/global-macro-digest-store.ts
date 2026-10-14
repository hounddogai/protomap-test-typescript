import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalMacroDigest } from "./global-macro-digest.js";

/** Keeps global macro digests by code. */
export interface GlobalMacroDigestStore {
  find(code: string): GlobalMacroDigest | undefined;
  save(item: GlobalMacroDigest): void;
  remove(code: string): boolean;
  list(): GlobalMacroDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalMacroDigestStore implements GlobalMacroDigestStore {
  items: Map<string, GlobalMacroDigest>;
  order: string[];

  constructor(items: Map<string, GlobalMacroDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalMacroDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalMacroDigest): void {
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

  list(): GlobalMacroDigest[] {
    const out: GlobalMacroDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalMacroDigestStore(): GlobalMacroDigestStore {
  return new MemoryGlobalMacroDigestStore(new Map<string, GlobalMacroDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalMacroDigestStore implements GlobalMacroDigestStore {
  inner: GlobalMacroDigestStore;
  cache: cache.TtlCache<GlobalMacroDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalMacroDigestStore,
    cacheValue: cache.TtlCache<GlobalMacroDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalMacroDigest | undefined {
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

  save(item: GlobalMacroDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalMacroDigest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalMacroDigestStore(inner: GlobalMacroDigestStore, ttl: number, clockValue: clock.Clock): GlobalMacroDigestStore {
  return new CachedGlobalMacroDigestStore(inner, cache.newTtlCache<GlobalMacroDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects global macro digests. Empty fields match all. */
export class GlobalMacroDigestQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalMacroDigest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalMacroDigest[]): GlobalMacroDigest[] {
    const matched = collections.filter(items, (candidate: GlobalMacroDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalMacroDigests(store: GlobalMacroDigestStore, query: GlobalMacroDigestQuery): GlobalMacroDigest[] {
  return query.apply(store.list());
}
