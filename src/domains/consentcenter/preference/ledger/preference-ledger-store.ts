import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceLedger } from "./preference-ledger.js";

/** Keeps preference ledgers by code. */
export interface PreferenceLedgerStore {
  find(code: string): PreferenceLedger | undefined;
  save(item: PreferenceLedger): void;
  remove(code: string): boolean;
  list(): PreferenceLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceLedgerStore implements PreferenceLedgerStore {
  items: Map<string, PreferenceLedger>;
  order: string[];

  constructor(items: Map<string, PreferenceLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceLedger): void {
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

  list(): PreferenceLedger[] {
    const out: PreferenceLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceLedgerStore(): PreferenceLedgerStore {
  return new MemoryPreferenceLedgerStore(new Map<string, PreferenceLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceLedgerStore implements PreferenceLedgerStore {
  inner: PreferenceLedgerStore;
  cache: cache.TtlCache<PreferenceLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceLedgerStore,
    cacheValue: cache.TtlCache<PreferenceLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceLedger | undefined {
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

  save(item: PreferenceLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceLedger[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceLedgerStore(inner: PreferenceLedgerStore, ttl: number, clockValue: clock.Clock): PreferenceLedgerStore {
  return new CachedPreferenceLedgerStore(inner, cache.newTtlCache<PreferenceLedger>(1024, ttl, clockValue), 0, 0);
}

/** Selects preference ledgers. Empty fields match all. */
export class PreferenceLedgerQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceLedger[]): PreferenceLedger[] {
    const matched = collections.filter(items, (candidate: PreferenceLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceLedgers(store: PreferenceLedgerStore, query: PreferenceLedgerQuery): PreferenceLedger[] {
  return query.apply(store.list());
}
