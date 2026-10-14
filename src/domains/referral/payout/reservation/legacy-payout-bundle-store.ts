import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPayoutBundle } from "./legacy-payout-bundle.js";

/** Keeps legacy payout bundles by code. */
export interface LegacyPayoutBundleStore {
  find(code: string): LegacyPayoutBundle | undefined;
  save(item: LegacyPayoutBundle): void;
  remove(code: string): boolean;
  list(): LegacyPayoutBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPayoutBundleStore implements LegacyPayoutBundleStore {
  items: Map<string, LegacyPayoutBundle>;
  order: string[];

  constructor(items: Map<string, LegacyPayoutBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPayoutBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPayoutBundle): void {
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

  list(): LegacyPayoutBundle[] {
    const out: LegacyPayoutBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPayoutBundleStore(): LegacyPayoutBundleStore {
  return new MemoryLegacyPayoutBundleStore(new Map<string, LegacyPayoutBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPayoutBundleStore implements LegacyPayoutBundleStore {
  inner: LegacyPayoutBundleStore;
  cache: cache.TtlCache<LegacyPayoutBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPayoutBundleStore,
    cacheValue: cache.TtlCache<LegacyPayoutBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPayoutBundle | undefined {
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

  save(item: LegacyPayoutBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPayoutBundle[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPayoutBundleStore(inner: LegacyPayoutBundleStore, ttl: number, clockValue: clock.Clock): LegacyPayoutBundleStore {
  return new CachedLegacyPayoutBundleStore(inner, cache.newTtlCache<LegacyPayoutBundle>(128, ttl, clockValue), 0, 0);
}

/** Selects legacy payout bundles. Empty fields match all. */
export class LegacyPayoutBundleQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPayoutBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPayoutBundle[]): LegacyPayoutBundle[] {
    const matched = collections.filter(items, (candidate: LegacyPayoutBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPayoutBundles(store: LegacyPayoutBundleStore, query: LegacyPayoutBundleQuery): LegacyPayoutBundle[] {
  return query.apply(store.list());
}
