import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowAgreement } from "./window-agreement.js";

/** Keeps window agreements by code. */
export interface WindowAgreementStore {
  find(code: string): WindowAgreement | undefined;
  save(item: WindowAgreement): void;
  remove(code: string): boolean;
  list(): WindowAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowAgreementStore implements WindowAgreementStore {
  items: Map<string, WindowAgreement>;
  order: string[];

  constructor(items: Map<string, WindowAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowAgreement): void {
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

  list(): WindowAgreement[] {
    const out: WindowAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowAgreementStore(): WindowAgreementStore {
  return new MemoryWindowAgreementStore(new Map<string, WindowAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowAgreementStore implements WindowAgreementStore {
  inner: WindowAgreementStore;
  cache: cache.TtlCache<WindowAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowAgreementStore,
    cacheValue: cache.TtlCache<WindowAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowAgreement | undefined {
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

  save(item: WindowAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowAgreement[] {
    return this.inner.list();
  }
}

export function newCachedWindowAgreementStore(inner: WindowAgreementStore, ttl: number, clockValue: clock.Clock): WindowAgreementStore {
  return new CachedWindowAgreementStore(inner, cache.newTtlCache<WindowAgreement>(1024, ttl, clockValue), 0, 0);
}

/** Selects window agreements. Empty fields match all. */
export class WindowAgreementQuery {
  category: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowAgreement): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowAgreement[]): WindowAgreement[] {
    const matched = collections.filter(items, (candidate: WindowAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowAgreements(store: WindowAgreementStore, query: WindowAgreementQuery): WindowAgreement[] {
  return query.apply(store.list());
}
