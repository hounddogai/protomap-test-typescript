import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultCreditDigest } from "./default-credit-digest.js";

/** Keeps default credit digests by code. */
export interface DefaultCreditDigestStore {
  find(code: string): DefaultCreditDigest | undefined;
  save(item: DefaultCreditDigest): void;
  remove(code: string): boolean;
  list(): DefaultCreditDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultCreditDigestStore implements DefaultCreditDigestStore {
  items: Map<string, DefaultCreditDigest>;
  order: string[];

  constructor(items: Map<string, DefaultCreditDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultCreditDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultCreditDigest): void {
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

  list(): DefaultCreditDigest[] {
    const out: DefaultCreditDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultCreditDigestStore(): DefaultCreditDigestStore {
  return new MemoryDefaultCreditDigestStore(new Map<string, DefaultCreditDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultCreditDigestStore implements DefaultCreditDigestStore {
  inner: DefaultCreditDigestStore;
  cache: cache.TtlCache<DefaultCreditDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultCreditDigestStore,
    cacheValue: cache.TtlCache<DefaultCreditDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultCreditDigest | undefined {
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

  save(item: DefaultCreditDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultCreditDigest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultCreditDigestStore(inner: DefaultCreditDigestStore, ttl: number, clockValue: clock.Clock): DefaultCreditDigestStore {
  return new CachedDefaultCreditDigestStore(inner, cache.newTtlCache<DefaultCreditDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects default credit digests. Empty fields match all. */
export class DefaultCreditDigestQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultCreditDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultCreditDigest[]): DefaultCreditDigest[] {
    const matched = collections.filter(items, (candidate: DefaultCreditDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultCreditDigests(store: DefaultCreditDigestStore, query: DefaultCreditDigestQuery): DefaultCreditDigest[] {
  return query.apply(store.list());
}
