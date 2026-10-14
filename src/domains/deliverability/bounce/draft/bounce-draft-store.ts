import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceDraft } from "./bounce-draft.js";

/** Keeps bounce drafts by code. */
export interface BounceDraftStore {
  find(code: string): BounceDraft | undefined;
  save(item: BounceDraft): void;
  remove(code: string): boolean;
  list(): BounceDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceDraftStore implements BounceDraftStore {
  items: Map<string, BounceDraft>;
  order: string[];

  constructor(items: Map<string, BounceDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceDraft): void {
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

  list(): BounceDraft[] {
    const out: BounceDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceDraftStore(): BounceDraftStore {
  return new MemoryBounceDraftStore(new Map<string, BounceDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceDraftStore implements BounceDraftStore {
  inner: BounceDraftStore;
  cache: cache.TtlCache<BounceDraft>;
  hits: number;
  misses: number;

  constructor(inner: BounceDraftStore, cacheValue: cache.TtlCache<BounceDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceDraft | undefined {
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

  save(item: BounceDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceDraft[] {
    return this.inner.list();
  }
}

export function newCachedBounceDraftStore(inner: BounceDraftStore, ttl: number, clockValue: clock.Clock): BounceDraftStore {
  return new CachedBounceDraftStore(inner, cache.newTtlCache<BounceDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects bounce drafts. Empty fields match all. */
export class BounceDraftQuery {
  region: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minSendAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceDraft): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceDraft[]): BounceDraft[] {
    const matched = collections.filter(items, (candidate: BounceDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceDrafts(store: BounceDraftStore, query: BounceDraftQuery): BounceDraft[] {
  return query.apply(store.list());
}
