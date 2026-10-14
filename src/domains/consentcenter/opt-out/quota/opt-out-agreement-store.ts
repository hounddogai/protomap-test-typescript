import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutAgreement } from "./opt-out-agreement.js";

/** Keeps opt out agreements by code. */
export interface OptOutAgreementStore {
  find(code: string): OptOutAgreement | undefined;
  save(item: OptOutAgreement): void;
  remove(code: string): boolean;
  list(): OptOutAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutAgreementStore implements OptOutAgreementStore {
  items: Map<string, OptOutAgreement>;
  order: string[];

  constructor(items: Map<string, OptOutAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutAgreement): void {
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

  list(): OptOutAgreement[] {
    const out: OptOutAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutAgreementStore(): OptOutAgreementStore {
  return new MemoryOptOutAgreementStore(new Map<string, OptOutAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutAgreementStore implements OptOutAgreementStore {
  inner: OptOutAgreementStore;
  cache: cache.TtlCache<OptOutAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutAgreementStore,
    cacheValue: cache.TtlCache<OptOutAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutAgreement | undefined {
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

  save(item: OptOutAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutAgreement[] {
    return this.inner.list();
  }
}

export function newCachedOptOutAgreementStore(inner: OptOutAgreementStore, ttl: number, clockValue: clock.Clock): OptOutAgreementStore {
  return new CachedOptOutAgreementStore(inner, cache.newTtlCache<OptOutAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects opt out agreements. Empty fields match all. */
export class OptOutAgreementQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutAgreement): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutAgreement[]): OptOutAgreement[] {
    const matched = collections.filter(items, (candidate: OptOutAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutAgreements(store: OptOutAgreementStore, query: OptOutAgreementQuery): OptOutAgreement[] {
  return query.apply(store.list());
}
