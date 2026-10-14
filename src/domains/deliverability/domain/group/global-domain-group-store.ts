import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalDomainGroup } from "./global-domain-group.js";

/** Keeps global domain groups by code. */
export interface GlobalDomainGroupStore {
  find(code: string): GlobalDomainGroup | undefined;
  save(item: GlobalDomainGroup): void;
  remove(code: string): boolean;
  list(): GlobalDomainGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalDomainGroupStore implements GlobalDomainGroupStore {
  items: Map<string, GlobalDomainGroup>;
  order: string[];

  constructor(items: Map<string, GlobalDomainGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalDomainGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalDomainGroup): void {
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

  list(): GlobalDomainGroup[] {
    const out: GlobalDomainGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalDomainGroupStore(): GlobalDomainGroupStore {
  return new MemoryGlobalDomainGroupStore(new Map<string, GlobalDomainGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalDomainGroupStore implements GlobalDomainGroupStore {
  inner: GlobalDomainGroupStore;
  cache: cache.TtlCache<GlobalDomainGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalDomainGroupStore,
    cacheValue: cache.TtlCache<GlobalDomainGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalDomainGroup | undefined {
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

  save(item: GlobalDomainGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalDomainGroup[] {
    return this.inner.list();
  }
}

export function newCachedGlobalDomainGroupStore(inner: GlobalDomainGroupStore, ttl: number, clockValue: clock.Clock): GlobalDomainGroupStore {
  return new CachedGlobalDomainGroupStore(inner, cache.newTtlCache<GlobalDomainGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects global domain groups. Empty fields match all. */
export class GlobalDomainGroupQuery {
  segment: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWeight: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalDomainGroup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalDomainGroup[]): GlobalDomainGroup[] {
    const matched = collections.filter(items, (candidate: GlobalDomainGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalDomainGroups(store: GlobalDomainGroupStore, query: GlobalDomainGroupQuery): GlobalDomainGroup[] {
  return query.apply(store.list());
}
