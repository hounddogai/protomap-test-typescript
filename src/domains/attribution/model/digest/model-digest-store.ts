import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelDigest } from "./model-digest.js";

/** Keeps model digests by code. */
export interface ModelDigestStore {
  find(code: string): ModelDigest | undefined;
  save(item: ModelDigest): void;
  remove(code: string): boolean;
  list(): ModelDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelDigestStore implements ModelDigestStore {
  items: Map<string, ModelDigest>;
  order: string[];

  constructor(items: Map<string, ModelDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelDigest): void {
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

  list(): ModelDigest[] {
    const out: ModelDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelDigestStore(): ModelDigestStore {
  return new MemoryModelDigestStore(new Map<string, ModelDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelDigestStore implements ModelDigestStore {
  inner: ModelDigestStore;
  cache: cache.TtlCache<ModelDigest>;
  hits: number;
  misses: number;

  constructor(inner: ModelDigestStore, cacheValue: cache.TtlCache<ModelDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelDigest | undefined {
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

  save(item: ModelDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelDigest[] {
    return this.inner.list();
  }
}

export function newCachedModelDigestStore(inner: ModelDigestStore, ttl: number, clockValue: clock.Clock): ModelDigestStore {
  return new CachedModelDigestStore(inner, cache.newTtlCache<ModelDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects model digests. Empty fields match all. */
export class ModelDigestQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelDigest[]): ModelDigest[] {
    const matched = collections.filter(items, (candidate: ModelDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelDigests(store: ModelDigestStore, query: ModelDigestQuery): ModelDigest[] {
  return query.apply(store.list());
}
