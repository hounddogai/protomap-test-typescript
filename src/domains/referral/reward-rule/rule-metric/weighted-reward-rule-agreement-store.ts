import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleAgreement } from "./weighted-reward-rule-agreement.js";

/** Keeps weighted reward rule agreements by code. */
export interface WeightedRewardRuleAgreementStore {
  find(code: string): WeightedRewardRuleAgreement | undefined;
  save(item: WeightedRewardRuleAgreement): void;
  remove(code: string): boolean;
  list(): WeightedRewardRuleAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardRuleAgreementStore implements WeightedRewardRuleAgreementStore {
  items: Map<string, WeightedRewardRuleAgreement>;
  order: string[];

  constructor(items: Map<string, WeightedRewardRuleAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardRuleAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardRuleAgreement): void {
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

  list(): WeightedRewardRuleAgreement[] {
    const out: WeightedRewardRuleAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardRuleAgreementStore(): WeightedRewardRuleAgreementStore {
  return new MemoryWeightedRewardRuleAgreementStore(new Map<string, WeightedRewardRuleAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardRuleAgreementStore implements WeightedRewardRuleAgreementStore {
  inner: WeightedRewardRuleAgreementStore;
  cache: cache.TtlCache<WeightedRewardRuleAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardRuleAgreementStore,
    cacheValue: cache.TtlCache<WeightedRewardRuleAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardRuleAgreement | undefined {
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

  save(item: WeightedRewardRuleAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardRuleAgreement[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardRuleAgreementStore(inner: WeightedRewardRuleAgreementStore, ttl: number, clockValue: clock.Clock): WeightedRewardRuleAgreementStore {
  return new CachedWeightedRewardRuleAgreementStore(
    inner,
    cache.newTtlCache<WeightedRewardRuleAgreement>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward rule agreements. Empty fields match all. */
export class WeightedRewardRuleAgreementQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardRuleAgreement): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardRuleAgreement[]): WeightedRewardRuleAgreement[] {
    const matched = collections.filter(items, (candidate: WeightedRewardRuleAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardRuleAgreements(store: WeightedRewardRuleAgreementStore, query: WeightedRewardRuleAgreementQuery): WeightedRewardRuleAgreement[] {
  return query.apply(store.list());
}
