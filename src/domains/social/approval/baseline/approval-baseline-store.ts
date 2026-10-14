import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalBaseline } from "./approval-baseline.js";

/** Keeps approval baselines by code. */
export interface ApprovalBaselineStore {
  find(code: string): ApprovalBaseline | undefined;
  save(item: ApprovalBaseline): void;
  remove(code: string): boolean;
  list(): ApprovalBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalBaselineStore implements ApprovalBaselineStore {
  items: Map<string, ApprovalBaseline>;
  order: string[];

  constructor(items: Map<string, ApprovalBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalBaseline): void {
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

  list(): ApprovalBaseline[] {
    const out: ApprovalBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalBaselineStore(): ApprovalBaselineStore {
  return new MemoryApprovalBaselineStore(new Map<string, ApprovalBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalBaselineStore implements ApprovalBaselineStore {
  inner: ApprovalBaselineStore;
  cache: cache.TtlCache<ApprovalBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalBaselineStore,
    cacheValue: cache.TtlCache<ApprovalBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalBaseline | undefined {
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

  save(item: ApprovalBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalBaseline[] {
    return this.inner.list();
  }
}

export function newCachedApprovalBaselineStore(inner: ApprovalBaselineStore, ttl: number, clockValue: clock.Clock): ApprovalBaselineStore {
  return new CachedApprovalBaselineStore(inner, cache.newTtlCache<ApprovalBaseline>(128, ttl, clockValue), 0, 0);
}

/** Selects approval baselines. Empty fields match all. */
export class ApprovalBaselineQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalBaseline[]): ApprovalBaseline[] {
    const matched = collections.filter(items, (candidate: ApprovalBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalBaselines(store: ApprovalBaselineStore, query: ApprovalBaselineQuery): ApprovalBaseline[] {
  return query.apply(store.list());
}
