import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalApprovalOverride } from "./regional-approval-override.js";

/** Keeps regional approval overrides by code. */
export interface RegionalApprovalOverrideStore {
  find(code: string): RegionalApprovalOverride | undefined;
  save(item: RegionalApprovalOverride): void;
  remove(code: string): boolean;
  list(): RegionalApprovalOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalApprovalOverrideStore implements RegionalApprovalOverrideStore {
  items: Map<string, RegionalApprovalOverride>;
  order: string[];

  constructor(items: Map<string, RegionalApprovalOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalApprovalOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalApprovalOverride): void {
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

  list(): RegionalApprovalOverride[] {
    const out: RegionalApprovalOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalApprovalOverrideStore(): RegionalApprovalOverrideStore {
  return new MemoryRegionalApprovalOverrideStore(new Map<string, RegionalApprovalOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalApprovalOverrideStore implements RegionalApprovalOverrideStore {
  inner: RegionalApprovalOverrideStore;
  cache: cache.TtlCache<RegionalApprovalOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalApprovalOverrideStore,
    cacheValue: cache.TtlCache<RegionalApprovalOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalApprovalOverride | undefined {
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

  save(item: RegionalApprovalOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalApprovalOverride[] {
    return this.inner.list();
  }
}

export function newCachedRegionalApprovalOverrideStore(inner: RegionalApprovalOverrideStore, ttl: number, clockValue: clock.Clock): RegionalApprovalOverrideStore {
  return new CachedRegionalApprovalOverrideStore(
    inner,
    cache.newTtlCache<RegionalApprovalOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional approval overrides. Empty fields match all. */
export class RegionalApprovalOverrideQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalApprovalOverride): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalApprovalOverride[]): RegionalApprovalOverride[] {
    const matched = collections.filter(items, (candidate: RegionalApprovalOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalApprovalOverrides(store: RegionalApprovalOverrideStore, query: RegionalApprovalOverrideQuery): RegionalApprovalOverride[] {
  return query.apply(store.list());
}
