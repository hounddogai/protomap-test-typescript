import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryWaitPolicy } from "./primary-wait-policy.js";

/** Keeps primary wait policies by code. */
export interface PrimaryWaitPolicyStore {
  find(code: string): PrimaryWaitPolicy | undefined;
  save(item: PrimaryWaitPolicy): void;
  remove(code: string): boolean;
  list(): PrimaryWaitPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryWaitPolicyStore implements PrimaryWaitPolicyStore {
  items: Map<string, PrimaryWaitPolicy>;
  order: string[];

  constructor(items: Map<string, PrimaryWaitPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryWaitPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryWaitPolicy): void {
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

  list(): PrimaryWaitPolicy[] {
    const out: PrimaryWaitPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryWaitPolicyStore(): PrimaryWaitPolicyStore {
  return new MemoryPrimaryWaitPolicyStore(new Map<string, PrimaryWaitPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryWaitPolicyStore implements PrimaryWaitPolicyStore {
  inner: PrimaryWaitPolicyStore;
  cache: cache.TtlCache<PrimaryWaitPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryWaitPolicyStore,
    cacheValue: cache.TtlCache<PrimaryWaitPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryWaitPolicy | undefined {
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

  save(item: PrimaryWaitPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryWaitPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryWaitPolicyStore(inner: PrimaryWaitPolicyStore, ttl: number, clockValue: clock.Clock): PrimaryWaitPolicyStore {
  return new CachedPrimaryWaitPolicyStore(inner, cache.newTtlCache<PrimaryWaitPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects primary wait policies. Empty fields match all. */
export class PrimaryWaitPolicyQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryWaitPolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryWaitPolicy[]): PrimaryWaitPolicy[] {
    const matched = collections.filter(items, (candidate: PrimaryWaitPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryWaitPolicies(store: PrimaryWaitPolicyStore, query: PrimaryWaitPolicyQuery): PrimaryWaitPolicy[] {
  return query.apply(store.list());
}
