import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintBundle } from "./complaint-bundle.js";

/** Keeps complaint bundles by code. */
export interface ComplaintBundleStore {
  find(code: string): ComplaintBundle | undefined;
  save(item: ComplaintBundle): void;
  remove(code: string): boolean;
  list(): ComplaintBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintBundleStore implements ComplaintBundleStore {
  items: Map<string, ComplaintBundle>;
  order: string[];

  constructor(items: Map<string, ComplaintBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintBundle): void {
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

  list(): ComplaintBundle[] {
    const out: ComplaintBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintBundleStore(): ComplaintBundleStore {
  return new MemoryComplaintBundleStore(new Map<string, ComplaintBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintBundleStore implements ComplaintBundleStore {
  inner: ComplaintBundleStore;
  cache: cache.TtlCache<ComplaintBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintBundleStore,
    cacheValue: cache.TtlCache<ComplaintBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintBundle | undefined {
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

  save(item: ComplaintBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintBundle[] {
    return this.inner.list();
  }
}

export function newCachedComplaintBundleStore(inner: ComplaintBundleStore, ttl: number, clockValue: clock.Clock): ComplaintBundleStore {
  return new CachedComplaintBundleStore(inner, cache.newTtlCache<ComplaintBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint bundles. Empty fields match all. */
export class ComplaintBundleQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintBundle[]): ComplaintBundle[] {
    const matched = collections.filter(items, (candidate: ComplaintBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintBundles(store: ComplaintBundleStore, query: ComplaintBundleQuery): ComplaintBundle[] {
  return query.apply(store.list());
}
