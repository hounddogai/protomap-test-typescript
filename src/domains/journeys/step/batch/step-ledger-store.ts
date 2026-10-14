import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepLedger } from "./step-ledger.js";

/** Keeps step ledgers by code. */
export interface StepLedgerStore {
  find(code: string): StepLedger | undefined;
  save(item: StepLedger): void;
  remove(code: string): boolean;
  list(): StepLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepLedgerStore implements StepLedgerStore {
  items: Map<string, StepLedger>;
  order: string[];

  constructor(items: Map<string, StepLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepLedger): void {
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

  list(): StepLedger[] {
    const out: StepLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepLedgerStore(): StepLedgerStore {
  return new MemoryStepLedgerStore(new Map<string, StepLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepLedgerStore implements StepLedgerStore {
  inner: StepLedgerStore;
  cache: cache.TtlCache<StepLedger>;
  hits: number;
  misses: number;

  constructor(inner: StepLedgerStore, cacheValue: cache.TtlCache<StepLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepLedger | undefined {
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

  save(item: StepLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepLedger[] {
    return this.inner.list();
  }
}

export function newCachedStepLedgerStore(inner: StepLedgerStore, ttl: number, clockValue: clock.Clock): StepLedgerStore {
  return new CachedStepLedgerStore(inner, cache.newTtlCache<StepLedger>(512, ttl, clockValue), 0, 0);
}

/** Selects step ledgers. Empty fields match all. */
export class StepLedgerQuery {
  utmSource: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWeight: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepLedger): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepLedger[]): StepLedger[] {
    const matched = collections.filter(items, (candidate: StepLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepLedgers(store: StepLedgerStore, query: StepLedgerQuery): StepLedger[] {
  return query.apply(store.list());
}
