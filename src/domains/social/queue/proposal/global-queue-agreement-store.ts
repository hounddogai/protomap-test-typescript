import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalQueueAgreement } from "./global-queue-agreement.js";

/** Keeps global queue agreements by code. */
export interface GlobalQueueAgreementStore {
  find(code: string): GlobalQueueAgreement | undefined;
  save(item: GlobalQueueAgreement): void;
  remove(code: string): boolean;
  list(): GlobalQueueAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalQueueAgreementStore implements GlobalQueueAgreementStore {
  items: Map<string, GlobalQueueAgreement>;
  order: string[];

  constructor(items: Map<string, GlobalQueueAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalQueueAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalQueueAgreement): void {
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

  list(): GlobalQueueAgreement[] {
    const out: GlobalQueueAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalQueueAgreementStore(): GlobalQueueAgreementStore {
  return new MemoryGlobalQueueAgreementStore(new Map<string, GlobalQueueAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalQueueAgreementStore implements GlobalQueueAgreementStore {
  inner: GlobalQueueAgreementStore;
  cache: cache.TtlCache<GlobalQueueAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalQueueAgreementStore,
    cacheValue: cache.TtlCache<GlobalQueueAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalQueueAgreement | undefined {
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

  save(item: GlobalQueueAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalQueueAgreement[] {
    return this.inner.list();
  }
}

export function newCachedGlobalQueueAgreementStore(inner: GlobalQueueAgreementStore, ttl: number, clockValue: clock.Clock): GlobalQueueAgreementStore {
  return new CachedGlobalQueueAgreementStore(inner, cache.newTtlCache<GlobalQueueAgreement>(64, ttl, clockValue), 0, 0);
}

/** Selects global queue agreements. Empty fields match all. */
export class GlobalQueueAgreementQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalQueueAgreement): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalQueueAgreement[]): GlobalQueueAgreement[] {
    const matched = collections.filter(items, (candidate: GlobalQueueAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalQueueAgreements(store: GlobalQueueAgreementStore, query: GlobalQueueAgreementQuery): GlobalQueueAgreement[] {
  return query.apply(store.list());
}
