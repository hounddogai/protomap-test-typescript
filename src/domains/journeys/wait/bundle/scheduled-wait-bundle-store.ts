import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWaitBundle } from "./scheduled-wait-bundle.js";

/** Keeps scheduled wait bundles by code. */
export interface ScheduledWaitBundleStore {
  find(code: string): ScheduledWaitBundle | undefined;
  save(item: ScheduledWaitBundle): void;
  remove(code: string): boolean;
  list(): ScheduledWaitBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWaitBundleStore implements ScheduledWaitBundleStore {
  items: Map<string, ScheduledWaitBundle>;
  order: string[];

  constructor(items: Map<string, ScheduledWaitBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWaitBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWaitBundle): void {
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

  list(): ScheduledWaitBundle[] {
    const out: ScheduledWaitBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWaitBundleStore(): ScheduledWaitBundleStore {
  return new MemoryScheduledWaitBundleStore(new Map<string, ScheduledWaitBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWaitBundleStore implements ScheduledWaitBundleStore {
  inner: ScheduledWaitBundleStore;
  cache: cache.TtlCache<ScheduledWaitBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWaitBundleStore,
    cacheValue: cache.TtlCache<ScheduledWaitBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWaitBundle | undefined {
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

  save(item: ScheduledWaitBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWaitBundle[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWaitBundleStore(inner: ScheduledWaitBundleStore, ttl: number, clockValue: clock.Clock): ScheduledWaitBundleStore {
  return new CachedScheduledWaitBundleStore(inner, cache.newTtlCache<ScheduledWaitBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects scheduled wait bundles. Empty fields match all. */
export class ScheduledWaitBundleQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWaitBundle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWaitBundle[]): ScheduledWaitBundle[] {
    const matched = collections.filter(items, (candidate: ScheduledWaitBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWaitBundles(store: ScheduledWaitBundleStore, query: ScheduledWaitBundleQuery): ScheduledWaitBundle[] {
  return query.apply(store.list());
}
