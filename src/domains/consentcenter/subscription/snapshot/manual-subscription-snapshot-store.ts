import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

/** Keeps manual subscription snapshots by code. */
export interface ManualSubscriptionSnapshotStore {
  find(code: string): ManualSubscriptionSnapshot | undefined;
  save(item: ManualSubscriptionSnapshot): void;
  remove(code: string): boolean;
  list(): ManualSubscriptionSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSubscriptionSnapshotStore implements ManualSubscriptionSnapshotStore {
  items: Map<string, ManualSubscriptionSnapshot>;
  order: string[];

  constructor(items: Map<string, ManualSubscriptionSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSubscriptionSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSubscriptionSnapshot): void {
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

  list(): ManualSubscriptionSnapshot[] {
    const out: ManualSubscriptionSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSubscriptionSnapshotStore(): ManualSubscriptionSnapshotStore {
  return new MemoryManualSubscriptionSnapshotStore(new Map<string, ManualSubscriptionSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSubscriptionSnapshotStore implements ManualSubscriptionSnapshotStore {
  inner: ManualSubscriptionSnapshotStore;
  cache: cache.TtlCache<ManualSubscriptionSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSubscriptionSnapshotStore,
    cacheValue: cache.TtlCache<ManualSubscriptionSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSubscriptionSnapshot | undefined {
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

  save(item: ManualSubscriptionSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSubscriptionSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedManualSubscriptionSnapshotStore(inner: ManualSubscriptionSnapshotStore, ttl: number, clockValue: clock.Clock): ManualSubscriptionSnapshotStore {
  return new CachedManualSubscriptionSnapshotStore(
    inner,
    cache.newTtlCache<ManualSubscriptionSnapshot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual subscription snapshots. Empty fields match all. */
export class ManualSubscriptionSnapshotQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSubscriptionSnapshot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSubscriptionSnapshot[]): ManualSubscriptionSnapshot[] {
    const matched = collections.filter(items, (candidate: ManualSubscriptionSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSubscriptionSnapshots(store: ManualSubscriptionSnapshotStore, query: ManualSubscriptionSnapshotQuery): ManualSubscriptionSnapshot[] {
  return query.apply(store.list());
}
