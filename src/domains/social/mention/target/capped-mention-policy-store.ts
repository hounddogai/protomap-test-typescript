import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedMentionPolicy } from "./capped-mention-policy.js";

/** Keeps capped mention policies by code. */
export interface CappedMentionPolicyStore {
  find(code: string): CappedMentionPolicy | undefined;
  save(item: CappedMentionPolicy): void;
  remove(code: string): boolean;
  list(): CappedMentionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedMentionPolicyStore implements CappedMentionPolicyStore {
  items: Map<string, CappedMentionPolicy>;
  order: string[];

  constructor(items: Map<string, CappedMentionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedMentionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedMentionPolicy): void {
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

  list(): CappedMentionPolicy[] {
    const out: CappedMentionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedMentionPolicyStore(): CappedMentionPolicyStore {
  return new MemoryCappedMentionPolicyStore(new Map<string, CappedMentionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedMentionPolicyStore implements CappedMentionPolicyStore {
  inner: CappedMentionPolicyStore;
  cache: cache.TtlCache<CappedMentionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedMentionPolicyStore,
    cacheValue: cache.TtlCache<CappedMentionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedMentionPolicy | undefined {
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

  save(item: CappedMentionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedMentionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedCappedMentionPolicyStore(inner: CappedMentionPolicyStore, ttl: number, clockValue: clock.Clock): CappedMentionPolicyStore {
  return new CachedCappedMentionPolicyStore(inner, cache.newTtlCache<CappedMentionPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects capped mention policies. Empty fields match all. */
export class CappedMentionPolicyQuery {
  country: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedMentionPolicy): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedMentionPolicy[]): CappedMentionPolicy[] {
    const matched = collections.filter(items, (candidate: CappedMentionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedMentionPolicies(store: CappedMentionPolicyStore, query: CappedMentionPolicyQuery): CappedMentionPolicy[] {
  return query.apply(store.list());
}
