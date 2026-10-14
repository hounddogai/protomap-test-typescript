import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFrequencyClaim } from "./global-frequency-claim.js";

/** Keeps global frequency claims by code. */
export interface GlobalFrequencyClaimStore {
  find(code: string): GlobalFrequencyClaim | undefined;
  save(item: GlobalFrequencyClaim): void;
  remove(code: string): boolean;
  list(): GlobalFrequencyClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFrequencyClaimStore implements GlobalFrequencyClaimStore {
  items: Map<string, GlobalFrequencyClaim>;
  order: string[];

  constructor(items: Map<string, GlobalFrequencyClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFrequencyClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFrequencyClaim): void {
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

  list(): GlobalFrequencyClaim[] {
    const out: GlobalFrequencyClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFrequencyClaimStore(): GlobalFrequencyClaimStore {
  return new MemoryGlobalFrequencyClaimStore(new Map<string, GlobalFrequencyClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFrequencyClaimStore implements GlobalFrequencyClaimStore {
  inner: GlobalFrequencyClaimStore;
  cache: cache.TtlCache<GlobalFrequencyClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFrequencyClaimStore,
    cacheValue: cache.TtlCache<GlobalFrequencyClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFrequencyClaim | undefined {
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

  save(item: GlobalFrequencyClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFrequencyClaim[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFrequencyClaimStore(inner: GlobalFrequencyClaimStore, ttl: number, clockValue: clock.Clock): GlobalFrequencyClaimStore {
  return new CachedGlobalFrequencyClaimStore(
    inner,
    cache.newTtlCache<GlobalFrequencyClaim>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global frequency claims. Empty fields match all. */
export class GlobalFrequencyClaimQuery {
  label: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRevision: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFrequencyClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFrequencyClaim[]): GlobalFrequencyClaim[] {
    const matched = collections.filter(items, (candidate: GlobalFrequencyClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFrequencyClaims(store: GlobalFrequencyClaimStore, query: GlobalFrequencyClaimQuery): GlobalFrequencyClaim[] {
  return query.apply(store.list());
}
