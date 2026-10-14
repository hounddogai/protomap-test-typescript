import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyBundle } from "./reply-bundle.js";

/** Keeps reply bundles by code. */
export interface ReplyBundleStore {
  find(code: string): ReplyBundle | undefined;
  save(item: ReplyBundle): void;
  remove(code: string): boolean;
  list(): ReplyBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyBundleStore implements ReplyBundleStore {
  items: Map<string, ReplyBundle>;
  order: string[];

  constructor(items: Map<string, ReplyBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyBundle): void {
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

  list(): ReplyBundle[] {
    const out: ReplyBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyBundleStore(): ReplyBundleStore {
  return new MemoryReplyBundleStore(new Map<string, ReplyBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyBundleStore implements ReplyBundleStore {
  inner: ReplyBundleStore;
  cache: cache.TtlCache<ReplyBundle>;
  hits: number;
  misses: number;

  constructor(inner: ReplyBundleStore, cacheValue: cache.TtlCache<ReplyBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyBundle | undefined {
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

  save(item: ReplyBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyBundle[] {
    return this.inner.list();
  }
}

export function newCachedReplyBundleStore(inner: ReplyBundleStore, ttl: number, clockValue: clock.Clock): ReplyBundleStore {
  return new CachedReplyBundleStore(inner, cache.newTtlCache<ReplyBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects reply bundles. Empty fields match all. */
export class ReplyBundleQuery {
  region: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minVersion: number, statuses: string[], limit: number) {
    this.region = region;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyBundle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyBundle[]): ReplyBundle[] {
    const matched = collections.filter(items, (candidate: ReplyBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyBundles(store: ReplyBundleStore, query: ReplyBundleQuery): ReplyBundle[] {
  return query.apply(store.list());
}
