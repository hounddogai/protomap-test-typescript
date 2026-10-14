import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedProofRule } from "./capped-proof-rule.js";

/** Keeps capped proof rules by code. */
export interface CappedProofRuleStore {
  find(code: string): CappedProofRule | undefined;
  save(item: CappedProofRule): void;
  remove(code: string): boolean;
  list(): CappedProofRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedProofRuleStore implements CappedProofRuleStore {
  items: Map<string, CappedProofRule>;
  order: string[];

  constructor(items: Map<string, CappedProofRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedProofRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedProofRule): void {
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

  list(): CappedProofRule[] {
    const out: CappedProofRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedProofRuleStore(): CappedProofRuleStore {
  return new MemoryCappedProofRuleStore(new Map<string, CappedProofRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedProofRuleStore implements CappedProofRuleStore {
  inner: CappedProofRuleStore;
  cache: cache.TtlCache<CappedProofRule>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedProofRuleStore,
    cacheValue: cache.TtlCache<CappedProofRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedProofRule | undefined {
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

  save(item: CappedProofRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedProofRule[] {
    return this.inner.list();
  }
}

export function newCachedCappedProofRuleStore(inner: CappedProofRuleStore, ttl: number, clockValue: clock.Clock): CappedProofRuleStore {
  return new CachedCappedProofRuleStore(inner, cache.newTtlCache<CappedProofRule>(64, ttl, clockValue), 0, 0);
}

/** Selects capped proof rules. Empty fields match all. */
export class CappedProofRuleQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedProofRule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedProofRule[]): CappedProofRule[] {
    const matched = collections.filter(items, (candidate: CappedProofRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedProofRules(store: CappedProofRuleStore, query: CappedProofRuleQuery): CappedProofRule[] {
  return query.apply(store.list());
}
