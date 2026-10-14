import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalExitRuleTarget } from "./regional-exit-rule-target.js";

/** Keeps regional exit rule targets by code. */
export interface RegionalExitRuleTargetStore {
  find(code: string): RegionalExitRuleTarget | undefined;
  save(item: RegionalExitRuleTarget): void;
  remove(code: string): boolean;
  list(): RegionalExitRuleTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalExitRuleTargetStore implements RegionalExitRuleTargetStore {
  items: Map<string, RegionalExitRuleTarget>;
  order: string[];

  constructor(items: Map<string, RegionalExitRuleTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalExitRuleTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalExitRuleTarget): void {
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

  list(): RegionalExitRuleTarget[] {
    const out: RegionalExitRuleTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalExitRuleTargetStore(): RegionalExitRuleTargetStore {
  return new MemoryRegionalExitRuleTargetStore(new Map<string, RegionalExitRuleTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalExitRuleTargetStore implements RegionalExitRuleTargetStore {
  inner: RegionalExitRuleTargetStore;
  cache: cache.TtlCache<RegionalExitRuleTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalExitRuleTargetStore,
    cacheValue: cache.TtlCache<RegionalExitRuleTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalExitRuleTarget | undefined {
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

  save(item: RegionalExitRuleTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalExitRuleTarget[] {
    return this.inner.list();
  }
}

export function newCachedRegionalExitRuleTargetStore(inner: RegionalExitRuleTargetStore, ttl: number, clockValue: clock.Clock): RegionalExitRuleTargetStore {
  return new CachedRegionalExitRuleTargetStore(
    inner,
    cache.newTtlCache<RegionalExitRuleTarget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional exit rule targets. Empty fields match all. */
export class RegionalExitRuleTargetQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalExitRuleTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalExitRuleTarget[]): RegionalExitRuleTarget[] {
    const matched = collections.filter(items, (candidate: RegionalExitRuleTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalExitRuleTargets(store: RegionalExitRuleTargetStore, query: RegionalExitRuleTargetQuery): RegionalExitRuleTarget[] {
  return query.apply(store.list());
}
