import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPaywallWindow } from "./rolling-paywall-window.js";

/** Keeps rolling paywall windows by code. */
export interface RollingPaywallWindowStore {
  find(code: string): RollingPaywallWindow | undefined;
  save(item: RollingPaywallWindow): void;
  remove(code: string): boolean;
  list(): RollingPaywallWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPaywallWindowStore implements RollingPaywallWindowStore {
  items: Map<string, RollingPaywallWindow>;
  order: string[];

  constructor(items: Map<string, RollingPaywallWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPaywallWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPaywallWindow): void {
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

  list(): RollingPaywallWindow[] {
    const out: RollingPaywallWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPaywallWindowStore(): RollingPaywallWindowStore {
  return new MemoryRollingPaywallWindowStore(new Map<string, RollingPaywallWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPaywallWindowStore implements RollingPaywallWindowStore {
  inner: RollingPaywallWindowStore;
  cache: cache.TtlCache<RollingPaywallWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPaywallWindowStore,
    cacheValue: cache.TtlCache<RollingPaywallWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPaywallWindow | undefined {
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

  save(item: RollingPaywallWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPaywallWindow[] {
    return this.inner.list();
  }
}

export function newCachedRollingPaywallWindowStore(inner: RollingPaywallWindowStore, ttl: number, clockValue: clock.Clock): RollingPaywallWindowStore {
  return new CachedRollingPaywallWindowStore(
    inner,
    cache.newTtlCache<RollingPaywallWindow>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling paywall windows. Empty fields match all. */
export class RollingPaywallWindowQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPaywallWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPaywallWindow[]): RollingPaywallWindow[] {
    const matched = collections.filter(items, (candidate: RollingPaywallWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPaywallWindows(store: RollingPaywallWindowStore, query: RollingPaywallWindowQuery): RollingPaywallWindow[] {
  return query.apply(store.list());
}
