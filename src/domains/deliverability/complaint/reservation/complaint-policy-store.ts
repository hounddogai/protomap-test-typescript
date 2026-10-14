import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintPolicy } from "./complaint-policy.js";

/** Keeps complaint policies by code. */
export interface ComplaintPolicyStore {
  find(code: string): ComplaintPolicy | undefined;
  save(item: ComplaintPolicy): void;
  remove(code: string): boolean;
  list(): ComplaintPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintPolicyStore implements ComplaintPolicyStore {
  items: Map<string, ComplaintPolicy>;
  order: string[];

  constructor(items: Map<string, ComplaintPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintPolicy): void {
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

  list(): ComplaintPolicy[] {
    const out: ComplaintPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintPolicyStore(): ComplaintPolicyStore {
  return new MemoryComplaintPolicyStore(new Map<string, ComplaintPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintPolicyStore implements ComplaintPolicyStore {
  inner: ComplaintPolicyStore;
  cache: cache.TtlCache<ComplaintPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintPolicyStore,
    cacheValue: cache.TtlCache<ComplaintPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintPolicy | undefined {
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

  save(item: ComplaintPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintPolicy[] {
    return this.inner.list();
  }
}

export function newCachedComplaintPolicyStore(inner: ComplaintPolicyStore, ttl: number, clockValue: clock.Clock): ComplaintPolicyStore {
  return new CachedComplaintPolicyStore(inner, cache.newTtlCache<ComplaintPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects complaint policies. Empty fields match all. */
export class ComplaintPolicyQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintPolicy[]): ComplaintPolicy[] {
    const matched = collections.filter(items, (candidate: ComplaintPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintPolicies(store: ComplaintPolicyStore, query: ComplaintPolicyQuery): ComplaintPolicy[] {
  return query.apply(store.list());
}
