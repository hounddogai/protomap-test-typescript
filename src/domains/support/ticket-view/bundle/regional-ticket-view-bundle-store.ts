import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

/** Keeps regional ticket view bundles by code. */
export interface RegionalTicketViewBundleStore {
  find(code: string): RegionalTicketViewBundle | undefined;
  save(item: RegionalTicketViewBundle): void;
  remove(code: string): boolean;
  list(): RegionalTicketViewBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalTicketViewBundleStore implements RegionalTicketViewBundleStore {
  items: Map<string, RegionalTicketViewBundle>;
  order: string[];

  constructor(items: Map<string, RegionalTicketViewBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalTicketViewBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalTicketViewBundle): void {
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

  list(): RegionalTicketViewBundle[] {
    const out: RegionalTicketViewBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalTicketViewBundleStore(): RegionalTicketViewBundleStore {
  return new MemoryRegionalTicketViewBundleStore(new Map<string, RegionalTicketViewBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalTicketViewBundleStore implements RegionalTicketViewBundleStore {
  inner: RegionalTicketViewBundleStore;
  cache: cache.TtlCache<RegionalTicketViewBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalTicketViewBundleStore,
    cacheValue: cache.TtlCache<RegionalTicketViewBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalTicketViewBundle | undefined {
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

  save(item: RegionalTicketViewBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalTicketViewBundle[] {
    return this.inner.list();
  }
}

export function newCachedRegionalTicketViewBundleStore(inner: RegionalTicketViewBundleStore, ttl: number, clockValue: clock.Clock): RegionalTicketViewBundleStore {
  return new CachedRegionalTicketViewBundleStore(
    inner,
    cache.newTtlCache<RegionalTicketViewBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional ticket view bundles. Empty fields match all. */
export class RegionalTicketViewBundleQuery {
  region: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minQuantity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalTicketViewBundle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalTicketViewBundle[]): RegionalTicketViewBundle[] {
    const matched = collections.filter(items, (candidate: RegionalTicketViewBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalTicketViewBundles(store: RegionalTicketViewBundleStore, query: RegionalTicketViewBundleQuery): RegionalTicketViewBundle[] {
  return query.apply(store.list());
}
