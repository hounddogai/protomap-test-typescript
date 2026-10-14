import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryFlightPolicy } from "./primary-flight-policy.js";

/** Keeps primary flight policies by code. */
export interface PrimaryFlightPolicyStore {
  find(code: string): PrimaryFlightPolicy | undefined;
  save(item: PrimaryFlightPolicy): void;
  remove(code: string): boolean;
  list(): PrimaryFlightPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryFlightPolicyStore implements PrimaryFlightPolicyStore {
  items: Map<string, PrimaryFlightPolicy>;
  order: string[];

  constructor(items: Map<string, PrimaryFlightPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryFlightPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryFlightPolicy): void {
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

  list(): PrimaryFlightPolicy[] {
    const out: PrimaryFlightPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryFlightPolicyStore(): PrimaryFlightPolicyStore {
  return new MemoryPrimaryFlightPolicyStore(new Map<string, PrimaryFlightPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryFlightPolicyStore implements PrimaryFlightPolicyStore {
  inner: PrimaryFlightPolicyStore;
  cache: cache.TtlCache<PrimaryFlightPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryFlightPolicyStore,
    cacheValue: cache.TtlCache<PrimaryFlightPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryFlightPolicy | undefined {
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

  save(item: PrimaryFlightPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryFlightPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryFlightPolicyStore(inner: PrimaryFlightPolicyStore, ttl: number, clockValue: clock.Clock): PrimaryFlightPolicyStore {
  return new CachedPrimaryFlightPolicyStore(inner, cache.newTtlCache<PrimaryFlightPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary flight policies. Empty fields match all. */
export class PrimaryFlightPolicyQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryFlightPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryFlightPolicy[]): PrimaryFlightPolicy[] {
    const matched = collections.filter(items, (candidate: PrimaryFlightPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryFlightPolicies(store: PrimaryFlightPolicyStore, query: PrimaryFlightPolicyQuery): PrimaryFlightPolicy[] {
  return query.apply(store.list());
}
