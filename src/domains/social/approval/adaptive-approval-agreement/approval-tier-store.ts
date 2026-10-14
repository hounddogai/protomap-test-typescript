import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalTier } from "./approval-tier.js";

/** Keeps approval tiers by code. */
export interface ApprovalTierStore {
  find(code: string): ApprovalTier | undefined;
  save(item: ApprovalTier): void;
  remove(code: string): boolean;
  list(): ApprovalTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalTierStore implements ApprovalTierStore {
  items: Map<string, ApprovalTier>;
  order: string[];

  constructor(items: Map<string, ApprovalTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalTier): void {
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

  list(): ApprovalTier[] {
    const out: ApprovalTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalTierStore(): ApprovalTierStore {
  return new MemoryApprovalTierStore(new Map<string, ApprovalTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalTierStore implements ApprovalTierStore {
  inner: ApprovalTierStore;
  cache: cache.TtlCache<ApprovalTier>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalTierStore, cacheValue: cache.TtlCache<ApprovalTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalTier | undefined {
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

  save(item: ApprovalTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalTier[] {
    return this.inner.list();
  }
}

export function newCachedApprovalTierStore(inner: ApprovalTierStore, ttl: number, clockValue: clock.Clock): ApprovalTierStore {
  return new CachedApprovalTierStore(inner, cache.newTtlCache<ApprovalTier>(128, ttl, clockValue), 0, 0);
}

/** Selects approval tiers. Empty fields match all. */
export class ApprovalTierQuery {
  source: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBatchSize: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalTier): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalTier[]): ApprovalTier[] {
    const matched = collections.filter(items, (candidate: ApprovalTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalTiers(store: ApprovalTierStore, query: ApprovalTierQuery): ApprovalTier[] {
  return query.apply(store.list());
}
