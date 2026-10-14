import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingFrequencyClaim } from "./rolling-frequency-claim.js";

/** Keeps rolling frequency claims by code. */
export interface RollingFrequencyClaimStore {
  find(code: string): RollingFrequencyClaim | undefined;
  save(item: RollingFrequencyClaim): void;
  remove(code: string): boolean;
  list(): RollingFrequencyClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingFrequencyClaimStore implements RollingFrequencyClaimStore {
  items: Map<string, RollingFrequencyClaim>;
  order: string[];

  constructor(items: Map<string, RollingFrequencyClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingFrequencyClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingFrequencyClaim): void {
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

  list(): RollingFrequencyClaim[] {
    const out: RollingFrequencyClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingFrequencyClaimStore(): RollingFrequencyClaimStore {
  return new MemoryRollingFrequencyClaimStore(new Map<string, RollingFrequencyClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingFrequencyClaimStore implements RollingFrequencyClaimStore {
  inner: RollingFrequencyClaimStore;
  cache: cache.TtlCache<RollingFrequencyClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingFrequencyClaimStore,
    cacheValue: cache.TtlCache<RollingFrequencyClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingFrequencyClaim | undefined {
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

  save(item: RollingFrequencyClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingFrequencyClaim[] {
    return this.inner.list();
  }
}

export function newCachedRollingFrequencyClaimStore(inner: RollingFrequencyClaimStore, ttl: number, clockValue: clock.Clock): RollingFrequencyClaimStore {
  return new CachedRollingFrequencyClaimStore(
    inner,
    cache.newTtlCache<RollingFrequencyClaim>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling frequency claims. Empty fields match all. */
export class RollingFrequencyClaimQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingFrequencyClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingFrequencyClaim[]): RollingFrequencyClaim[] {
    const matched = collections.filter(items, (candidate: RollingFrequencyClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingFrequencyClaims(store: RollingFrequencyClaimStore, query: RollingFrequencyClaimQuery): RollingFrequencyClaim[] {
  return query.apply(store.list());
}
