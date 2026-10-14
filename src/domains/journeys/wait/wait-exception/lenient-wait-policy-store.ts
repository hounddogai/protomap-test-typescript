import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWaitPolicy } from "./lenient-wait-policy.js";

/** Keeps lenient wait policies by code. */
export interface LenientWaitPolicyStore {
  find(code: string): LenientWaitPolicy | undefined;
  save(item: LenientWaitPolicy): void;
  remove(code: string): boolean;
  list(): LenientWaitPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWaitPolicyStore implements LenientWaitPolicyStore {
  items: Map<string, LenientWaitPolicy>;
  order: string[];

  constructor(items: Map<string, LenientWaitPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWaitPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWaitPolicy): void {
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

  list(): LenientWaitPolicy[] {
    const out: LenientWaitPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWaitPolicyStore(): LenientWaitPolicyStore {
  return new MemoryLenientWaitPolicyStore(new Map<string, LenientWaitPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWaitPolicyStore implements LenientWaitPolicyStore {
  inner: LenientWaitPolicyStore;
  cache: cache.TtlCache<LenientWaitPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWaitPolicyStore,
    cacheValue: cache.TtlCache<LenientWaitPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWaitPolicy | undefined {
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

  save(item: LenientWaitPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWaitPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLenientWaitPolicyStore(inner: LenientWaitPolicyStore, ttl: number, clockValue: clock.Clock): LenientWaitPolicyStore {
  return new CachedLenientWaitPolicyStore(inner, cache.newTtlCache<LenientWaitPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient wait policies. Empty fields match all. */
export class LenientWaitPolicyQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWaitPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWaitPolicy[]): LenientWaitPolicy[] {
    const matched = collections.filter(items, (candidate: LenientWaitPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWaitPolicies(store: LenientWaitPolicyStore, query: LenientWaitPolicyQuery): LenientWaitPolicy[] {
  return query.apply(store.list());
}
