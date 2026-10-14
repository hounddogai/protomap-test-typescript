import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainProfile } from "./domain-profile.js";

/** Keeps domain profiles by code. */
export interface DomainProfileStore {
  find(code: string): DomainProfile | undefined;
  save(item: DomainProfile): void;
  remove(code: string): boolean;
  list(): DomainProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainProfileStore implements DomainProfileStore {
  items: Map<string, DomainProfile>;
  order: string[];

  constructor(items: Map<string, DomainProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainProfile): void {
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

  list(): DomainProfile[] {
    const out: DomainProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainProfileStore(): DomainProfileStore {
  return new MemoryDomainProfileStore(new Map<string, DomainProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainProfileStore implements DomainProfileStore {
  inner: DomainProfileStore;
  cache: cache.TtlCache<DomainProfile>;
  hits: number;
  misses: number;

  constructor(inner: DomainProfileStore, cacheValue: cache.TtlCache<DomainProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainProfile | undefined {
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

  save(item: DomainProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainProfile[] {
    return this.inner.list();
  }
}

export function newCachedDomainProfileStore(inner: DomainProfileStore, ttl: number, clockValue: clock.Clock): DomainProfileStore {
  return new CachedDomainProfileStore(inner, cache.newTtlCache<DomainProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects domain profiles. Empty fields match all. */
export class DomainProfileQuery {
  category: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBid: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainProfile): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainProfile[]): DomainProfile[] {
    const matched = collections.filter(items, (candidate: DomainProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainProfiles(store: DomainProfileStore, query: DomainProfileQuery): DomainProfile[] {
  return query.apply(store.list());
}
