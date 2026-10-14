import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingComplaintBundle } from "./pending-complaint-bundle.js";

/** Keeps pending complaint bundles by code. */
export interface PendingComplaintBundleStore {
  find(code: string): PendingComplaintBundle | undefined;
  save(item: PendingComplaintBundle): void;
  remove(code: string): boolean;
  list(): PendingComplaintBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingComplaintBundleStore implements PendingComplaintBundleStore {
  items: Map<string, PendingComplaintBundle>;
  order: string[];

  constructor(items: Map<string, PendingComplaintBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingComplaintBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingComplaintBundle): void {
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

  list(): PendingComplaintBundle[] {
    const out: PendingComplaintBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingComplaintBundleStore(): PendingComplaintBundleStore {
  return new MemoryPendingComplaintBundleStore(new Map<string, PendingComplaintBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingComplaintBundleStore implements PendingComplaintBundleStore {
  inner: PendingComplaintBundleStore;
  cache: cache.TtlCache<PendingComplaintBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingComplaintBundleStore,
    cacheValue: cache.TtlCache<PendingComplaintBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingComplaintBundle | undefined {
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

  save(item: PendingComplaintBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingComplaintBundle[] {
    return this.inner.list();
  }
}

export function newCachedPendingComplaintBundleStore(inner: PendingComplaintBundleStore, ttl: number, clockValue: clock.Clock): PendingComplaintBundleStore {
  return new CachedPendingComplaintBundleStore(
    inner,
    cache.newTtlCache<PendingComplaintBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending complaint bundles. Empty fields match all. */
export class PendingComplaintBundleQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingComplaintBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingComplaintBundle[]): PendingComplaintBundle[] {
    const matched = collections.filter(items, (candidate: PendingComplaintBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingComplaintBundles(store: PendingComplaintBundleStore, query: PendingComplaintBundleQuery): PendingComplaintBundle[] {
  return query.apply(store.list());
}
