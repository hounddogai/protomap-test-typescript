import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCreditBundle } from "./scheduled-credit-bundle.js";

/** Keeps scheduled credit bundles by code. */
export interface ScheduledCreditBundleStore {
  find(code: string): ScheduledCreditBundle | undefined;
  save(item: ScheduledCreditBundle): void;
  remove(code: string): boolean;
  list(): ScheduledCreditBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCreditBundleStore implements ScheduledCreditBundleStore {
  items: Map<string, ScheduledCreditBundle>;
  order: string[];

  constructor(items: Map<string, ScheduledCreditBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCreditBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCreditBundle): void {
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

  list(): ScheduledCreditBundle[] {
    const out: ScheduledCreditBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCreditBundleStore(): ScheduledCreditBundleStore {
  return new MemoryScheduledCreditBundleStore(new Map<string, ScheduledCreditBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCreditBundleStore implements ScheduledCreditBundleStore {
  inner: ScheduledCreditBundleStore;
  cache: cache.TtlCache<ScheduledCreditBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCreditBundleStore,
    cacheValue: cache.TtlCache<ScheduledCreditBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCreditBundle | undefined {
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

  save(item: ScheduledCreditBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCreditBundle[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCreditBundleStore(inner: ScheduledCreditBundleStore, ttl: number, clockValue: clock.Clock): ScheduledCreditBundleStore {
  return new CachedScheduledCreditBundleStore(
    inner,
    cache.newTtlCache<ScheduledCreditBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled credit bundles. Empty fields match all. */
export class ScheduledCreditBundleQuery {
  utmSource: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minClicks: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCreditBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCreditBundle[]): ScheduledCreditBundle[] {
    const matched = collections.filter(items, (candidate: ScheduledCreditBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCreditBundles(store: ScheduledCreditBundleStore, query: ScheduledCreditBundleQuery): ScheduledCreditBundle[] {
  return query.apply(store.list());
}
