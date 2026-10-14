import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainGroup } from "./domain-group.js";

/** Keeps domain groups by code. */
export interface DomainGroupStore {
  find(code: string): DomainGroup | undefined;
  save(item: DomainGroup): void;
  remove(code: string): boolean;
  list(): DomainGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainGroupStore implements DomainGroupStore {
  items: Map<string, DomainGroup>;
  order: string[];

  constructor(items: Map<string, DomainGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainGroup): void {
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

  list(): DomainGroup[] {
    const out: DomainGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainGroupStore(): DomainGroupStore {
  return new MemoryDomainGroupStore(new Map<string, DomainGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainGroupStore implements DomainGroupStore {
  inner: DomainGroupStore;
  cache: cache.TtlCache<DomainGroup>;
  hits: number;
  misses: number;

  constructor(inner: DomainGroupStore, cacheValue: cache.TtlCache<DomainGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainGroup | undefined {
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

  save(item: DomainGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainGroup[] {
    return this.inner.list();
  }
}

export function newCachedDomainGroupStore(inner: DomainGroupStore, ttl: number, clockValue: clock.Clock): DomainGroupStore {
  return new CachedDomainGroupStore(inner, cache.newTtlCache<DomainGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects domain groups. Empty fields match all. */
export class DomainGroupQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainGroup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainGroup[]): DomainGroup[] {
    const matched = collections.filter(items, (candidate: DomainGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainGroups(store: DomainGroupStore, query: DomainGroupQuery): DomainGroup[] {
  return query.apply(store.list());
}
