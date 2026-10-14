import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultDeflectionDigest } from "./default-deflection-digest.js";

/** Keeps default deflection digests by code. */
export interface DefaultDeflectionDigestStore {
  find(code: string): DefaultDeflectionDigest | undefined;
  save(item: DefaultDeflectionDigest): void;
  remove(code: string): boolean;
  list(): DefaultDeflectionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultDeflectionDigestStore implements DefaultDeflectionDigestStore {
  items: Map<string, DefaultDeflectionDigest>;
  order: string[];

  constructor(items: Map<string, DefaultDeflectionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultDeflectionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultDeflectionDigest): void {
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

  list(): DefaultDeflectionDigest[] {
    const out: DefaultDeflectionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultDeflectionDigestStore(): DefaultDeflectionDigestStore {
  return new MemoryDefaultDeflectionDigestStore(new Map<string, DefaultDeflectionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultDeflectionDigestStore implements DefaultDeflectionDigestStore {
  inner: DefaultDeflectionDigestStore;
  cache: cache.TtlCache<DefaultDeflectionDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultDeflectionDigestStore,
    cacheValue: cache.TtlCache<DefaultDeflectionDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultDeflectionDigest | undefined {
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

  save(item: DefaultDeflectionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultDeflectionDigest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultDeflectionDigestStore(inner: DefaultDeflectionDigestStore, ttl: number, clockValue: clock.Clock): DefaultDeflectionDigestStore {
  return new CachedDefaultDeflectionDigestStore(
    inner,
    cache.newTtlCache<DefaultDeflectionDigest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default deflection digests. Empty fields match all. */
export class DefaultDeflectionDigestQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultDeflectionDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultDeflectionDigest[]): DefaultDeflectionDigest[] {
    const matched = collections.filter(items, (candidate: DefaultDeflectionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultDeflectionDigests(store: DefaultDeflectionDigestStore, query: DefaultDeflectionDigestQuery): DefaultDeflectionDigest[] {
  return query.apply(store.list());
}
