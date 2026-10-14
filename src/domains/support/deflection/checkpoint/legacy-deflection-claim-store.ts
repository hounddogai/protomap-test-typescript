import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDeflectionClaim } from "./legacy-deflection-claim.js";

/** Keeps legacy deflection claims by code. */
export interface LegacyDeflectionClaimStore {
  find(code: string): LegacyDeflectionClaim | undefined;
  save(item: LegacyDeflectionClaim): void;
  remove(code: string): boolean;
  list(): LegacyDeflectionClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDeflectionClaimStore implements LegacyDeflectionClaimStore {
  items: Map<string, LegacyDeflectionClaim>;
  order: string[];

  constructor(items: Map<string, LegacyDeflectionClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDeflectionClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDeflectionClaim): void {
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

  list(): LegacyDeflectionClaim[] {
    const out: LegacyDeflectionClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDeflectionClaimStore(): LegacyDeflectionClaimStore {
  return new MemoryLegacyDeflectionClaimStore(new Map<string, LegacyDeflectionClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDeflectionClaimStore implements LegacyDeflectionClaimStore {
  inner: LegacyDeflectionClaimStore;
  cache: cache.TtlCache<LegacyDeflectionClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDeflectionClaimStore,
    cacheValue: cache.TtlCache<LegacyDeflectionClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDeflectionClaim | undefined {
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

  save(item: LegacyDeflectionClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDeflectionClaim[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDeflectionClaimStore(inner: LegacyDeflectionClaimStore, ttl: number, clockValue: clock.Clock): LegacyDeflectionClaimStore {
  return new CachedLegacyDeflectionClaimStore(
    inner,
    cache.newTtlCache<LegacyDeflectionClaim>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy deflection claims. Empty fields match all. */
export class LegacyDeflectionClaimQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDeflectionClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDeflectionClaim[]): LegacyDeflectionClaim[] {
    const matched = collections.filter(items, (candidate: LegacyDeflectionClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDeflectionClaims(store: LegacyDeflectionClaimStore, query: LegacyDeflectionClaimQuery): LegacyDeflectionClaim[] {
  return query.apply(store.list());
}
