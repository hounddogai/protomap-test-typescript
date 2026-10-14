import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalBundle } from "./approval-bundle.js";

/** Keeps approval bundles by code. */
export interface ApprovalBundleStore {
  find(code: string): ApprovalBundle | undefined;
  save(item: ApprovalBundle): void;
  remove(code: string): boolean;
  list(): ApprovalBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalBundleStore implements ApprovalBundleStore {
  items: Map<string, ApprovalBundle>;
  order: string[];

  constructor(items: Map<string, ApprovalBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalBundle): void {
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

  list(): ApprovalBundle[] {
    const out: ApprovalBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalBundleStore(): ApprovalBundleStore {
  return new MemoryApprovalBundleStore(new Map<string, ApprovalBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalBundleStore implements ApprovalBundleStore {
  inner: ApprovalBundleStore;
  cache: cache.TtlCache<ApprovalBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalBundleStore,
    cacheValue: cache.TtlCache<ApprovalBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalBundle | undefined {
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

  save(item: ApprovalBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalBundle[] {
    return this.inner.list();
  }
}

export function newCachedApprovalBundleStore(inner: ApprovalBundleStore, ttl: number, clockValue: clock.Clock): ApprovalBundleStore {
  return new CachedApprovalBundleStore(inner, cache.newTtlCache<ApprovalBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects approval bundles. Empty fields match all. */
export class ApprovalBundleQuery {
  category: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalBundle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalBundle[]): ApprovalBundle[] {
    const matched = collections.filter(items, (candidate: ApprovalBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalBundles(store: ApprovalBundleStore, query: ApprovalBundleQuery): ApprovalBundle[] {
  return query.apply(store.list());
}
