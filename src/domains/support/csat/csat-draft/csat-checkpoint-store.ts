import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatCheckpoint } from "./csat-checkpoint.js";

/** Keeps csat checkpoints by code. */
export interface CsatCheckpointStore {
  find(code: string): CsatCheckpoint | undefined;
  save(item: CsatCheckpoint): void;
  remove(code: string): boolean;
  list(): CsatCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatCheckpointStore implements CsatCheckpointStore {
  items: Map<string, CsatCheckpoint>;
  order: string[];

  constructor(items: Map<string, CsatCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatCheckpoint): void {
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

  list(): CsatCheckpoint[] {
    const out: CsatCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatCheckpointStore(): CsatCheckpointStore {
  return new MemoryCsatCheckpointStore(new Map<string, CsatCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatCheckpointStore implements CsatCheckpointStore {
  inner: CsatCheckpointStore;
  cache: cache.TtlCache<CsatCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: CsatCheckpointStore,
    cacheValue: cache.TtlCache<CsatCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatCheckpoint | undefined {
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

  save(item: CsatCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedCsatCheckpointStore(inner: CsatCheckpointStore, ttl: number, clockValue: clock.Clock): CsatCheckpointStore {
  return new CachedCsatCheckpointStore(inner, cache.newTtlCache<CsatCheckpoint>(1024, ttl, clockValue), 0, 0);
}

/** Selects csat checkpoints. Empty fields match all. */
export class CsatCheckpointQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatCheckpoint): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatCheckpoint[]): CsatCheckpoint[] {
    const matched = collections.filter(items, (candidate: CsatCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatCheckpoints(store: CsatCheckpointStore, query: CsatCheckpointQuery): CsatCheckpoint[] {
  return query.apply(store.list());
}
