import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPaywallRequest } from "./default-paywall-request.js";

/** Keeps default paywall requests by code. */
export interface DefaultPaywallRequestStore {
  find(code: string): DefaultPaywallRequest | undefined;
  save(item: DefaultPaywallRequest): void;
  remove(code: string): boolean;
  list(): DefaultPaywallRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPaywallRequestStore implements DefaultPaywallRequestStore {
  items: Map<string, DefaultPaywallRequest>;
  order: string[];

  constructor(items: Map<string, DefaultPaywallRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPaywallRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPaywallRequest): void {
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

  list(): DefaultPaywallRequest[] {
    const out: DefaultPaywallRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPaywallRequestStore(): DefaultPaywallRequestStore {
  return new MemoryDefaultPaywallRequestStore(new Map<string, DefaultPaywallRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPaywallRequestStore implements DefaultPaywallRequestStore {
  inner: DefaultPaywallRequestStore;
  cache: cache.TtlCache<DefaultPaywallRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPaywallRequestStore,
    cacheValue: cache.TtlCache<DefaultPaywallRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPaywallRequest | undefined {
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

  save(item: DefaultPaywallRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPaywallRequest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPaywallRequestStore(inner: DefaultPaywallRequestStore, ttl: number, clockValue: clock.Clock): DefaultPaywallRequestStore {
  return new CachedDefaultPaywallRequestStore(
    inner,
    cache.newTtlCache<DefaultPaywallRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default paywall requests. Empty fields match all. */
export class DefaultPaywallRequestQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPaywallRequest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPaywallRequest[]): DefaultPaywallRequest[] {
    const matched = collections.filter(items, (candidate: DefaultPaywallRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPaywallRequests(store: DefaultPaywallRequestStore, query: DefaultPaywallRequestQuery): DefaultPaywallRequest[] {
  return query.apply(store.list());
}
