import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPayoutOverride } from "./primary-payout-override.js";

/** Keeps primary payout overrides by code. */
export interface PrimaryPayoutOverrideStore {
  find(code: string): PrimaryPayoutOverride | undefined;
  save(item: PrimaryPayoutOverride): void;
  remove(code: string): boolean;
  list(): PrimaryPayoutOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPayoutOverrideStore implements PrimaryPayoutOverrideStore {
  items: Map<string, PrimaryPayoutOverride>;
  order: string[];

  constructor(items: Map<string, PrimaryPayoutOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPayoutOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPayoutOverride): void {
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

  list(): PrimaryPayoutOverride[] {
    const out: PrimaryPayoutOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPayoutOverrideStore(): PrimaryPayoutOverrideStore {
  return new MemoryPrimaryPayoutOverrideStore(new Map<string, PrimaryPayoutOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPayoutOverrideStore implements PrimaryPayoutOverrideStore {
  inner: PrimaryPayoutOverrideStore;
  cache: cache.TtlCache<PrimaryPayoutOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPayoutOverrideStore,
    cacheValue: cache.TtlCache<PrimaryPayoutOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPayoutOverride | undefined {
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

  save(item: PrimaryPayoutOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPayoutOverride[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPayoutOverrideStore(inner: PrimaryPayoutOverrideStore, ttl: number, clockValue: clock.Clock): PrimaryPayoutOverrideStore {
  return new CachedPrimaryPayoutOverrideStore(
    inner,
    cache.newTtlCache<PrimaryPayoutOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary payout overrides. Empty fields match all. */
export class PrimaryPayoutOverrideQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPayoutOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPayoutOverride[]): PrimaryPayoutOverride[] {
    const matched = collections.filter(items, (candidate: PrimaryPayoutOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPayoutOverrides(store: PrimaryPayoutOverrideStore, query: PrimaryPayoutOverrideQuery): PrimaryPayoutOverride[] {
  return query.apply(store.list());
}
