import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupAgreement } from "./warmup-agreement.js";

/** Keeps warmup agreements by code. */
export interface WarmupAgreementStore {
  find(code: string): WarmupAgreement | undefined;
  save(item: WarmupAgreement): void;
  remove(code: string): boolean;
  list(): WarmupAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupAgreementStore implements WarmupAgreementStore {
  items: Map<string, WarmupAgreement>;
  order: string[];

  constructor(items: Map<string, WarmupAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupAgreement): void {
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

  list(): WarmupAgreement[] {
    const out: WarmupAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupAgreementStore(): WarmupAgreementStore {
  return new MemoryWarmupAgreementStore(new Map<string, WarmupAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupAgreementStore implements WarmupAgreementStore {
  inner: WarmupAgreementStore;
  cache: cache.TtlCache<WarmupAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupAgreementStore,
    cacheValue: cache.TtlCache<WarmupAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupAgreement | undefined {
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

  save(item: WarmupAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupAgreement[] {
    return this.inner.list();
  }
}

export function newCachedWarmupAgreementStore(inner: WarmupAgreementStore, ttl: number, clockValue: clock.Clock): WarmupAgreementStore {
  return new CachedWarmupAgreementStore(inner, cache.newTtlCache<WarmupAgreement>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup agreements. Empty fields match all. */
export class WarmupAgreementQuery {
  category: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAttempts: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupAgreement): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupAgreement[]): WarmupAgreement[] {
    const matched = collections.filter(items, (candidate: WarmupAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupAgreements(store: WarmupAgreementStore, query: WarmupAgreementQuery): WarmupAgreement[] {
  return query.apply(store.list());
}
