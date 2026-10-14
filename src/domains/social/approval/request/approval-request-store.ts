import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalRequest } from "./approval-request.js";

/** Keeps approval requests by code. */
export interface ApprovalRequestStore {
  find(code: string): ApprovalRequest | undefined;
  save(item: ApprovalRequest): void;
  remove(code: string): boolean;
  list(): ApprovalRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalRequestStore implements ApprovalRequestStore {
  items: Map<string, ApprovalRequest>;
  order: string[];

  constructor(items: Map<string, ApprovalRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalRequest): void {
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

  list(): ApprovalRequest[] {
    const out: ApprovalRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalRequestStore(): ApprovalRequestStore {
  return new MemoryApprovalRequestStore(new Map<string, ApprovalRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalRequestStore implements ApprovalRequestStore {
  inner: ApprovalRequestStore;
  cache: cache.TtlCache<ApprovalRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalRequestStore,
    cacheValue: cache.TtlCache<ApprovalRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalRequest | undefined {
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

  save(item: ApprovalRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalRequest[] {
    return this.inner.list();
  }
}

export function newCachedApprovalRequestStore(inner: ApprovalRequestStore, ttl: number, clockValue: clock.Clock): ApprovalRequestStore {
  return new CachedApprovalRequestStore(inner, cache.newTtlCache<ApprovalRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects approval requests. Empty fields match all. */
export class ApprovalRequestQuery {
  region: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMaximum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalRequest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalRequest[]): ApprovalRequest[] {
    const matched = collections.filter(items, (candidate: ApprovalRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalRequests(store: ApprovalRequestStore, query: ApprovalRequestQuery): ApprovalRequest[] {
  return query.apply(store.list());
}
