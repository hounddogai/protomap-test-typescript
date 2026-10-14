import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFlightLedger } from "./default-flight-ledger.js";

/** Keeps default flight ledgers by code. */
export interface DefaultFlightLedgerStore {
  find(code: string): DefaultFlightLedger | undefined;
  save(item: DefaultFlightLedger): void;
  remove(code: string): boolean;
  list(): DefaultFlightLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFlightLedgerStore implements DefaultFlightLedgerStore {
  items: Map<string, DefaultFlightLedger>;
  order: string[];

  constructor(items: Map<string, DefaultFlightLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFlightLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFlightLedger): void {
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

  list(): DefaultFlightLedger[] {
    const out: DefaultFlightLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFlightLedgerStore(): DefaultFlightLedgerStore {
  return new MemoryDefaultFlightLedgerStore(new Map<string, DefaultFlightLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFlightLedgerStore implements DefaultFlightLedgerStore {
  inner: DefaultFlightLedgerStore;
  cache: cache.TtlCache<DefaultFlightLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFlightLedgerStore,
    cacheValue: cache.TtlCache<DefaultFlightLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFlightLedger | undefined {
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

  save(item: DefaultFlightLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFlightLedger[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFlightLedgerStore(inner: DefaultFlightLedgerStore, ttl: number, clockValue: clock.Clock): DefaultFlightLedgerStore {
  return new CachedDefaultFlightLedgerStore(inner, cache.newTtlCache<DefaultFlightLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects default flight ledgers. Empty fields match all. */
export class DefaultFlightLedgerQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFlightLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFlightLedger[]): DefaultFlightLedger[] {
    const matched = collections.filter(items, (candidate: DefaultFlightLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFlightLedgers(store: DefaultFlightLedgerStore, query: DefaultFlightLedgerQuery): DefaultFlightLedger[] {
  return query.apply(store.list());
}
