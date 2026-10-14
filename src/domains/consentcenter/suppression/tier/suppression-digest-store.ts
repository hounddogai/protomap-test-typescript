import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionDigest } from "./suppression-digest.js";

/** Keeps suppression digests by code. */
export interface SuppressionDigestStore {
  find(code: string): SuppressionDigest | undefined;
  save(item: SuppressionDigest): void;
  remove(code: string): boolean;
  list(): SuppressionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionDigestStore implements SuppressionDigestStore {
  items: Map<string, SuppressionDigest>;
  order: string[];

  constructor(items: Map<string, SuppressionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionDigest): void {
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

  list(): SuppressionDigest[] {
    const out: SuppressionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionDigestStore(): SuppressionDigestStore {
  return new MemorySuppressionDigestStore(new Map<string, SuppressionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionDigestStore implements SuppressionDigestStore {
  inner: SuppressionDigestStore;
  cache: cache.TtlCache<SuppressionDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionDigestStore,
    cacheValue: cache.TtlCache<SuppressionDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionDigest | undefined {
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

  save(item: SuppressionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionDigest[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionDigestStore(inner: SuppressionDigestStore, ttl: number, clockValue: clock.Clock): SuppressionDigestStore {
  return new CachedSuppressionDigestStore(inner, cache.newTtlCache<SuppressionDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects suppression digests. Empty fields match all. */
export class SuppressionDigestQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionDigest[]): SuppressionDigest[] {
    const matched = collections.filter(items, (candidate: SuppressionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionDigests(store: SuppressionDigestStore, query: SuppressionDigestQuery): SuppressionDigest[] {
  return query.apply(store.list());
}
