import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDomainPolicy } from "./legacy-domain-policy.js";

/** Keeps legacy domain policies by code. */
export interface LegacyDomainPolicyStore {
  find(code: string): LegacyDomainPolicy | undefined;
  save(item: LegacyDomainPolicy): void;
  remove(code: string): boolean;
  list(): LegacyDomainPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDomainPolicyStore implements LegacyDomainPolicyStore {
  items: Map<string, LegacyDomainPolicy>;
  order: string[];

  constructor(items: Map<string, LegacyDomainPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDomainPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDomainPolicy): void {
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

  list(): LegacyDomainPolicy[] {
    const out: LegacyDomainPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDomainPolicyStore(): LegacyDomainPolicyStore {
  return new MemoryLegacyDomainPolicyStore(new Map<string, LegacyDomainPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDomainPolicyStore implements LegacyDomainPolicyStore {
  inner: LegacyDomainPolicyStore;
  cache: cache.TtlCache<LegacyDomainPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDomainPolicyStore,
    cacheValue: cache.TtlCache<LegacyDomainPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDomainPolicy | undefined {
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

  save(item: LegacyDomainPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDomainPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDomainPolicyStore(inner: LegacyDomainPolicyStore, ttl: number, clockValue: clock.Clock): LegacyDomainPolicyStore {
  return new CachedLegacyDomainPolicyStore(inner, cache.newTtlCache<LegacyDomainPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy domain policies. Empty fields match all. */
export class LegacyDomainPolicyQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDomainPolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDomainPolicy[]): LegacyDomainPolicy[] {
    const matched = collections.filter(items, (candidate: LegacyDomainPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDomainPolicies(store: LegacyDomainPolicyStore, query: LegacyDomainPolicyQuery): LegacyDomainPolicy[] {
  return query.apply(store.list());
}
