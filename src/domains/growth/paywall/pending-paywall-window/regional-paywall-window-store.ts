import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPaywallWindow } from "./regional-paywall-window.js";

/** Keeps regional paywall windows by code. */
export interface RegionalPaywallWindowStore {
  find(code: string): RegionalPaywallWindow | undefined;
  save(item: RegionalPaywallWindow): void;
  remove(code: string): boolean;
  list(): RegionalPaywallWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPaywallWindowStore implements RegionalPaywallWindowStore {
  items: Map<string, RegionalPaywallWindow>;
  order: string[];

  constructor(items: Map<string, RegionalPaywallWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPaywallWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPaywallWindow): void {
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

  list(): RegionalPaywallWindow[] {
    const out: RegionalPaywallWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPaywallWindowStore(): RegionalPaywallWindowStore {
  return new MemoryRegionalPaywallWindowStore(new Map<string, RegionalPaywallWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPaywallWindowStore implements RegionalPaywallWindowStore {
  inner: RegionalPaywallWindowStore;
  cache: cache.TtlCache<RegionalPaywallWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPaywallWindowStore,
    cacheValue: cache.TtlCache<RegionalPaywallWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPaywallWindow | undefined {
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

  save(item: RegionalPaywallWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPaywallWindow[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPaywallWindowStore(inner: RegionalPaywallWindowStore, ttl: number, clockValue: clock.Clock): RegionalPaywallWindowStore {
  return new CachedRegionalPaywallWindowStore(
    inner,
    cache.newTtlCache<RegionalPaywallWindow>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional paywall windows. Empty fields match all. */
export class RegionalPaywallWindowQuery {
  region: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minStartsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPaywallWindow): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPaywallWindow[]): RegionalPaywallWindow[] {
    const matched = collections.filter(items, (candidate: RegionalPaywallWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPaywallWindows(store: RegionalPaywallWindowStore, query: RegionalPaywallWindowQuery): RegionalPaywallWindow[] {
  return query.apply(store.list());
}
