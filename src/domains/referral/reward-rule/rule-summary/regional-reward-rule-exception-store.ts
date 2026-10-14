import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalRewardRuleException } from "./regional-reward-rule-exception.js";

/** Keeps regional reward rule exceptions by code. */
export interface RegionalRewardRuleExceptionStore {
  find(code: string): RegionalRewardRuleException | undefined;
  save(item: RegionalRewardRuleException): void;
  remove(code: string): boolean;
  list(): RegionalRewardRuleException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalRewardRuleExceptionStore implements RegionalRewardRuleExceptionStore {
  items: Map<string, RegionalRewardRuleException>;
  order: string[];

  constructor(items: Map<string, RegionalRewardRuleException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalRewardRuleException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalRewardRuleException): void {
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

  list(): RegionalRewardRuleException[] {
    const out: RegionalRewardRuleException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalRewardRuleExceptionStore(): RegionalRewardRuleExceptionStore {
  return new MemoryRegionalRewardRuleExceptionStore(new Map<string, RegionalRewardRuleException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalRewardRuleExceptionStore implements RegionalRewardRuleExceptionStore {
  inner: RegionalRewardRuleExceptionStore;
  cache: cache.TtlCache<RegionalRewardRuleException>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalRewardRuleExceptionStore,
    cacheValue: cache.TtlCache<RegionalRewardRuleException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalRewardRuleException | undefined {
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

  save(item: RegionalRewardRuleException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalRewardRuleException[] {
    return this.inner.list();
  }
}

export function newCachedRegionalRewardRuleExceptionStore(inner: RegionalRewardRuleExceptionStore, ttl: number, clockValue: clock.Clock): RegionalRewardRuleExceptionStore {
  return new CachedRegionalRewardRuleExceptionStore(
    inner,
    cache.newTtlCache<RegionalRewardRuleException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional reward rule exceptions. Empty fields match all. */
export class RegionalRewardRuleExceptionQuery {
  utmSource: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minScore: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalRewardRuleException): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalRewardRuleException[]): RegionalRewardRuleException[] {
    const matched = collections.filter(items, (candidate: RegionalRewardRuleException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalRewardRuleExceptions(store: RegionalRewardRuleExceptionStore, query: RegionalRewardRuleExceptionQuery): RegionalRewardRuleException[] {
  return query.apply(store.list());
}
