import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalOverride } from "./approval-override.js";

/** Keeps approval overrides by code. */
export interface ApprovalOverrideStore {
  find(code: string): ApprovalOverride | undefined;
  save(item: ApprovalOverride): void;
  remove(code: string): boolean;
  list(): ApprovalOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalOverrideStore implements ApprovalOverrideStore {
  items: Map<string, ApprovalOverride>;
  order: string[];

  constructor(items: Map<string, ApprovalOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalOverride): void {
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

  list(): ApprovalOverride[] {
    const out: ApprovalOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalOverrideStore(): ApprovalOverrideStore {
  return new MemoryApprovalOverrideStore(new Map<string, ApprovalOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalOverrideStore implements ApprovalOverrideStore {
  inner: ApprovalOverrideStore;
  cache: cache.TtlCache<ApprovalOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalOverrideStore,
    cacheValue: cache.TtlCache<ApprovalOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalOverride | undefined {
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

  save(item: ApprovalOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalOverride[] {
    return this.inner.list();
  }
}

export function newCachedApprovalOverrideStore(inner: ApprovalOverrideStore, ttl: number, clockValue: clock.Clock): ApprovalOverrideStore {
  return new CachedApprovalOverrideStore(inner, cache.newTtlCache<ApprovalOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects approval overrides. Empty fields match all. */
export class ApprovalOverrideQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalOverride): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalOverride[]): ApprovalOverride[] {
    const matched = collections.filter(items, (candidate: ApprovalOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalOverrides(store: ApprovalOverrideStore, query: ApprovalOverrideQuery): ApprovalOverride[] {
  return query.apply(store.list());
}
