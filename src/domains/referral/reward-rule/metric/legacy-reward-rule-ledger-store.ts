import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyRewardRuleLedger } from "./legacy-reward-rule-ledger.js";

/** Keeps legacy reward rule ledgers by code. */
export interface LegacyRewardRuleLedgerStore {
  find(code: string): LegacyRewardRuleLedger | undefined;
  save(item: LegacyRewardRuleLedger): void;
  remove(code: string): boolean;
  list(): LegacyRewardRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyRewardRuleLedgerStore implements LegacyRewardRuleLedgerStore {
  items: Map<string, LegacyRewardRuleLedger>;
  order: string[];

  constructor(items: Map<string, LegacyRewardRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyRewardRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyRewardRuleLedger): void {
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

  list(): LegacyRewardRuleLedger[] {
    const out: LegacyRewardRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyRewardRuleLedgerStore(): LegacyRewardRuleLedgerStore {
  return new MemoryLegacyRewardRuleLedgerStore(new Map<string, LegacyRewardRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyRewardRuleLedgerStore implements LegacyRewardRuleLedgerStore {
  inner: LegacyRewardRuleLedgerStore;
  cache: cache.TtlCache<LegacyRewardRuleLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyRewardRuleLedgerStore,
    cacheValue: cache.TtlCache<LegacyRewardRuleLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyRewardRuleLedger | undefined {
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

  save(item: LegacyRewardRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyRewardRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedLegacyRewardRuleLedgerStore(inner: LegacyRewardRuleLedgerStore, ttl: number, clockValue: clock.Clock): LegacyRewardRuleLedgerStore {
  return new CachedLegacyRewardRuleLedgerStore(
    inner,
    cache.newTtlCache<LegacyRewardRuleLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy reward rule ledgers. Empty fields match all. */
export class LegacyRewardRuleLedgerQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyRewardRuleLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyRewardRuleLedger[]): LegacyRewardRuleLedger[] {
    const matched = collections.filter(items, (candidate: LegacyRewardRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyRewardRuleLedgers(store: LegacyRewardRuleLedgerStore, query: LegacyRewardRuleLedgerQuery): LegacyRewardRuleLedger[] {
  return query.apply(store.list());
}
