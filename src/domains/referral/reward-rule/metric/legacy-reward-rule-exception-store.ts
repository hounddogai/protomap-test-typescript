import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyRewardRuleException } from "./legacy-reward-rule-exception.js";

/** Keeps legacy reward rule exceptions by code. */
export interface LegacyRewardRuleExceptionStore {
  find(code: string): LegacyRewardRuleException | undefined;
  save(item: LegacyRewardRuleException): void;
  remove(code: string): boolean;
  list(): LegacyRewardRuleException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyRewardRuleExceptionStore implements LegacyRewardRuleExceptionStore {
  items: Map<string, LegacyRewardRuleException>;
  order: string[];

  constructor(items: Map<string, LegacyRewardRuleException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyRewardRuleException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyRewardRuleException): void {
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

  list(): LegacyRewardRuleException[] {
    const out: LegacyRewardRuleException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyRewardRuleExceptionStore(): LegacyRewardRuleExceptionStore {
  return new MemoryLegacyRewardRuleExceptionStore(new Map<string, LegacyRewardRuleException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyRewardRuleExceptionStore implements LegacyRewardRuleExceptionStore {
  inner: LegacyRewardRuleExceptionStore;
  cache: cache.TtlCache<LegacyRewardRuleException>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyRewardRuleExceptionStore,
    cacheValue: cache.TtlCache<LegacyRewardRuleException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyRewardRuleException | undefined {
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

  save(item: LegacyRewardRuleException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyRewardRuleException[] {
    return this.inner.list();
  }
}

export function newCachedLegacyRewardRuleExceptionStore(inner: LegacyRewardRuleExceptionStore, ttl: number, clockValue: clock.Clock): LegacyRewardRuleExceptionStore {
  return new CachedLegacyRewardRuleExceptionStore(
    inner,
    cache.newTtlCache<LegacyRewardRuleException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy reward rule exceptions. Empty fields match all. */
export class LegacyRewardRuleExceptionQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyRewardRuleException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyRewardRuleException[]): LegacyRewardRuleException[] {
    const matched = collections.filter(items, (candidate: LegacyRewardRuleException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyRewardRuleExceptions(store: LegacyRewardRuleExceptionStore, query: LegacyRewardRuleExceptionQuery): LegacyRewardRuleException[] {
  return query.apply(store.list());
}
