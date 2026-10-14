import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofQuota } from "./proof-quota.js";

/** Keeps proof quotas by code. */
export interface ProofQuotaStore {
  find(code: string): ProofQuota | undefined;
  save(item: ProofQuota): void;
  remove(code: string): boolean;
  list(): ProofQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofQuotaStore implements ProofQuotaStore {
  items: Map<string, ProofQuota>;
  order: string[];

  constructor(items: Map<string, ProofQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofQuota): void {
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

  list(): ProofQuota[] {
    const out: ProofQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofQuotaStore(): ProofQuotaStore {
  return new MemoryProofQuotaStore(new Map<string, ProofQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofQuotaStore implements ProofQuotaStore {
  inner: ProofQuotaStore;
  cache: cache.TtlCache<ProofQuota>;
  hits: number;
  misses: number;

  constructor(inner: ProofQuotaStore, cacheValue: cache.TtlCache<ProofQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofQuota | undefined {
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

  save(item: ProofQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofQuota[] {
    return this.inner.list();
  }
}

export function newCachedProofQuotaStore(inner: ProofQuotaStore, ttl: number, clockValue: clock.Clock): ProofQuotaStore {
  return new CachedProofQuotaStore(inner, cache.newTtlCache<ProofQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects proof quotas. Empty fields match all. */
export class ProofQuotaQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofQuota): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofQuota[]): ProofQuota[] {
    const matched = collections.filter(items, (candidate: ProofQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofQuotas(store: ProofQuotaStore, query: ProofQuotaQuery): ProofQuota[] {
  return query.apply(store.list());
}
