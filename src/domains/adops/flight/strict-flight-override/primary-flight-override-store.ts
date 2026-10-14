import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryFlightOverride } from "./primary-flight-override.js";

/** Keeps primary flight overrides by code. */
export interface PrimaryFlightOverrideStore {
  find(code: string): PrimaryFlightOverride | undefined;
  save(item: PrimaryFlightOverride): void;
  remove(code: string): boolean;
  list(): PrimaryFlightOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryFlightOverrideStore implements PrimaryFlightOverrideStore {
  items: Map<string, PrimaryFlightOverride>;
  order: string[];

  constructor(items: Map<string, PrimaryFlightOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryFlightOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryFlightOverride): void {
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

  list(): PrimaryFlightOverride[] {
    const out: PrimaryFlightOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryFlightOverrideStore(): PrimaryFlightOverrideStore {
  return new MemoryPrimaryFlightOverrideStore(new Map<string, PrimaryFlightOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryFlightOverrideStore implements PrimaryFlightOverrideStore {
  inner: PrimaryFlightOverrideStore;
  cache: cache.TtlCache<PrimaryFlightOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryFlightOverrideStore,
    cacheValue: cache.TtlCache<PrimaryFlightOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryFlightOverride | undefined {
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

  save(item: PrimaryFlightOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryFlightOverride[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryFlightOverrideStore(inner: PrimaryFlightOverrideStore, ttl: number, clockValue: clock.Clock): PrimaryFlightOverrideStore {
  return new CachedPrimaryFlightOverrideStore(
    inner,
    cache.newTtlCache<PrimaryFlightOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary flight overrides. Empty fields match all. */
export class PrimaryFlightOverrideQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryFlightOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryFlightOverride[]): PrimaryFlightOverride[] {
    const matched = collections.filter(items, (candidate: PrimaryFlightOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryFlightOverrides(store: PrimaryFlightOverrideStore, query: PrimaryFlightOverrideQuery): PrimaryFlightOverride[] {
  return query.apply(store.list());
}
