import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintLedger } from "./adaptive-complaint-ledger.js";

/** Keeps adaptive complaint ledgers by code. */
export interface AdaptiveComplaintLedgerStore {
  find(code: string): AdaptiveComplaintLedger | undefined;
  save(item: AdaptiveComplaintLedger): void;
  remove(code: string): boolean;
  list(): AdaptiveComplaintLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveComplaintLedgerStore implements AdaptiveComplaintLedgerStore {
  items: Map<string, AdaptiveComplaintLedger>;
  order: string[];

  constructor(items: Map<string, AdaptiveComplaintLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveComplaintLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveComplaintLedger): void {
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

  list(): AdaptiveComplaintLedger[] {
    const out: AdaptiveComplaintLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveComplaintLedgerStore(): AdaptiveComplaintLedgerStore {
  return new MemoryAdaptiveComplaintLedgerStore(new Map<string, AdaptiveComplaintLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveComplaintLedgerStore implements AdaptiveComplaintLedgerStore {
  inner: AdaptiveComplaintLedgerStore;
  cache: cache.TtlCache<AdaptiveComplaintLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveComplaintLedgerStore,
    cacheValue: cache.TtlCache<AdaptiveComplaintLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveComplaintLedger | undefined {
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

  save(item: AdaptiveComplaintLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveComplaintLedger[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveComplaintLedgerStore(inner: AdaptiveComplaintLedgerStore, ttl: number, clockValue: clock.Clock): AdaptiveComplaintLedgerStore {
  return new CachedAdaptiveComplaintLedgerStore(
    inner,
    cache.newTtlCache<AdaptiveComplaintLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive complaint ledgers. Empty fields match all. */
export class AdaptiveComplaintLedgerQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveComplaintLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveComplaintLedger[]): AdaptiveComplaintLedger[] {
    const matched = collections.filter(items, (candidate: AdaptiveComplaintLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveComplaintLedgers(store: AdaptiveComplaintLedgerStore, query: AdaptiveComplaintLedgerQuery): AdaptiveComplaintLedger[] {
  return query.apply(store.list());
}
