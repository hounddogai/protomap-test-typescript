import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainPolicy } from "./domain-policy.js";

/** Keeps domain policies by code. */
export interface DomainPolicyStore {
  find(code: string): DomainPolicy | undefined;
  save(item: DomainPolicy): void;
  remove(code: string): boolean;
  list(): DomainPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainPolicyStore implements DomainPolicyStore {
  items: Map<string, DomainPolicy>;
  order: string[];

  constructor(items: Map<string, DomainPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainPolicy): void {
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

  list(): DomainPolicy[] {
    const out: DomainPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainPolicyStore(): DomainPolicyStore {
  return new MemoryDomainPolicyStore(new Map<string, DomainPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainPolicyStore implements DomainPolicyStore {
  inner: DomainPolicyStore;
  cache: cache.TtlCache<DomainPolicy>;
  hits: number;
  misses: number;

  constructor(inner: DomainPolicyStore, cacheValue: cache.TtlCache<DomainPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainPolicy | undefined {
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

  save(item: DomainPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainPolicy[] {
    return this.inner.list();
  }
}

export function newCachedDomainPolicyStore(inner: DomainPolicyStore, ttl: number, clockValue: clock.Clock): DomainPolicyStore {
  return new CachedDomainPolicyStore(inner, cache.newTtlCache<DomainPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects domain policies. Empty fields match all. */
export class DomainPolicyQuery {
  utmSource: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainPolicy): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainPolicy[]): DomainPolicy[] {
    const matched = collections.filter(items, (candidate: DomainPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainPolicies(store: DomainPolicyStore, query: DomainPolicyQuery): DomainPolicy[] {
  return query.apply(store.list());
}
