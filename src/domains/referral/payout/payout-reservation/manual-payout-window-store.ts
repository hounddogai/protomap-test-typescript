import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPayoutWindow } from "./manual-payout-window.js";

/** Keeps manual payout windows by code. */
export interface ManualPayoutWindowStore {
  find(code: string): ManualPayoutWindow | undefined;
  save(item: ManualPayoutWindow): void;
  remove(code: string): boolean;
  list(): ManualPayoutWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPayoutWindowStore implements ManualPayoutWindowStore {
  items: Map<string, ManualPayoutWindow>;
  order: string[];

  constructor(items: Map<string, ManualPayoutWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPayoutWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPayoutWindow): void {
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

  list(): ManualPayoutWindow[] {
    const out: ManualPayoutWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPayoutWindowStore(): ManualPayoutWindowStore {
  return new MemoryManualPayoutWindowStore(new Map<string, ManualPayoutWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPayoutWindowStore implements ManualPayoutWindowStore {
  inner: ManualPayoutWindowStore;
  cache: cache.TtlCache<ManualPayoutWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPayoutWindowStore,
    cacheValue: cache.TtlCache<ManualPayoutWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPayoutWindow | undefined {
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

  save(item: ManualPayoutWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPayoutWindow[] {
    return this.inner.list();
  }
}

export function newCachedManualPayoutWindowStore(inner: ManualPayoutWindowStore, ttl: number, clockValue: clock.Clock): ManualPayoutWindowStore {
  return new CachedManualPayoutWindowStore(inner, cache.newTtlCache<ManualPayoutWindow>(128, ttl, clockValue), 0, 0);
}

/** Selects manual payout windows. Empty fields match all. */
export class ManualPayoutWindowQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPayoutWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPayoutWindow[]): ManualPayoutWindow[] {
    const matched = collections.filter(items, (candidate: ManualPayoutWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPayoutWindows(store: ManualPayoutWindowStore, query: ManualPayoutWindowQuery): ManualPayoutWindow[] {
  return query.apply(store.list());
}
