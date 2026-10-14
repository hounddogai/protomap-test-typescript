import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleLedger } from "./adaptive-reward-rule-ledger.js";

/** Keeps adaptive reward rule ledgers by code. */
export interface AdaptiveRewardRuleLedgerStore {
  find(code: string): AdaptiveRewardRuleLedger | undefined;
  save(item: AdaptiveRewardRuleLedger): void;
  remove(code: string): boolean;
  list(): AdaptiveRewardRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveRewardRuleLedgerStore implements AdaptiveRewardRuleLedgerStore {
  items: Map<string, AdaptiveRewardRuleLedger>;
  order: string[];

  constructor(items: Map<string, AdaptiveRewardRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveRewardRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveRewardRuleLedger): void {
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

  list(): AdaptiveRewardRuleLedger[] {
    const out: AdaptiveRewardRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveRewardRuleLedgerStore(): AdaptiveRewardRuleLedgerStore {
  return new MemoryAdaptiveRewardRuleLedgerStore(new Map<string, AdaptiveRewardRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveRewardRuleLedgerStore implements AdaptiveRewardRuleLedgerStore {
  inner: AdaptiveRewardRuleLedgerStore;
  cache: cache.TtlCache<AdaptiveRewardRuleLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveRewardRuleLedgerStore,
    cacheValue: cache.TtlCache<AdaptiveRewardRuleLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveRewardRuleLedger | undefined {
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

  save(item: AdaptiveRewardRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveRewardRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveRewardRuleLedgerStore(inner: AdaptiveRewardRuleLedgerStore, ttl: number, clockValue: clock.Clock): AdaptiveRewardRuleLedgerStore {
  return new CachedAdaptiveRewardRuleLedgerStore(
    inner,
    cache.newTtlCache<AdaptiveRewardRuleLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive reward rule ledgers. Empty fields match all. */
export class AdaptiveRewardRuleLedgerQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveRewardRuleLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveRewardRuleLedger[]): AdaptiveRewardRuleLedger[] {
    const matched = collections.filter(items, (candidate: AdaptiveRewardRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveRewardRuleLedgers(store: AdaptiveRewardRuleLedgerStore, query: AdaptiveRewardRuleLedgerQuery): AdaptiveRewardRuleLedger[] {
  return query.apply(store.list());
}
