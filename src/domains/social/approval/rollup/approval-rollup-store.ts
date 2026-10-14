import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalRollup } from "./approval-rollup.js";

/** Keeps approval rollups by code. */
export interface ApprovalRollupStore {
  find(code: string): ApprovalRollup | undefined;
  save(item: ApprovalRollup): void;
  remove(code: string): boolean;
  list(): ApprovalRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalRollupStore implements ApprovalRollupStore {
  items: Map<string, ApprovalRollup>;
  order: string[];

  constructor(items: Map<string, ApprovalRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalRollup): void {
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

  list(): ApprovalRollup[] {
    const out: ApprovalRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalRollupStore(): ApprovalRollupStore {
  return new MemoryApprovalRollupStore(new Map<string, ApprovalRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalRollupStore implements ApprovalRollupStore {
  inner: ApprovalRollupStore;
  cache: cache.TtlCache<ApprovalRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalRollupStore,
    cacheValue: cache.TtlCache<ApprovalRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalRollup | undefined {
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

  save(item: ApprovalRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalRollup[] {
    return this.inner.list();
  }
}

export function newCachedApprovalRollupStore(inner: ApprovalRollupStore, ttl: number, clockValue: clock.Clock): ApprovalRollupStore {
  return new CachedApprovalRollupStore(inner, cache.newTtlCache<ApprovalRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects approval rollups. Empty fields match all. */
export class ApprovalRollupQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalRollup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalRollup[]): ApprovalRollup[] {
    const matched = collections.filter(items, (candidate: ApprovalRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalRollups(store: ApprovalRollupStore, query: ApprovalRollupQuery): ApprovalRollup[] {
  return query.apply(store.list());
}
