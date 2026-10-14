import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultBranchLedger } from "./default-branch-ledger.js";

/** Keeps default branch ledgers by code. */
export interface DefaultBranchLedgerStore {
  find(code: string): DefaultBranchLedger | undefined;
  save(item: DefaultBranchLedger): void;
  remove(code: string): boolean;
  list(): DefaultBranchLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultBranchLedgerStore implements DefaultBranchLedgerStore {
  items: Map<string, DefaultBranchLedger>;
  order: string[];

  constructor(items: Map<string, DefaultBranchLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultBranchLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultBranchLedger): void {
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

  list(): DefaultBranchLedger[] {
    const out: DefaultBranchLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultBranchLedgerStore(): DefaultBranchLedgerStore {
  return new MemoryDefaultBranchLedgerStore(new Map<string, DefaultBranchLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultBranchLedgerStore implements DefaultBranchLedgerStore {
  inner: DefaultBranchLedgerStore;
  cache: cache.TtlCache<DefaultBranchLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultBranchLedgerStore,
    cacheValue: cache.TtlCache<DefaultBranchLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultBranchLedger | undefined {
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

  save(item: DefaultBranchLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultBranchLedger[] {
    return this.inner.list();
  }
}

export function newCachedDefaultBranchLedgerStore(inner: DefaultBranchLedgerStore, ttl: number, clockValue: clock.Clock): DefaultBranchLedgerStore {
  return new CachedDefaultBranchLedgerStore(inner, cache.newTtlCache<DefaultBranchLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects default branch ledgers. Empty fields match all. */
export class DefaultBranchLedgerQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultBranchLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultBranchLedger[]): DefaultBranchLedger[] {
    const matched = collections.filter(items, (candidate: DefaultBranchLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultBranchLedgers(store: DefaultBranchLedgerStore, query: DefaultBranchLedgerQuery): DefaultBranchLedger[] {
  return query.apply(store.list());
}
