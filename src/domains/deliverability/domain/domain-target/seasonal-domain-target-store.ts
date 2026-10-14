import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalDomainTarget } from "./seasonal-domain-target.js";

/** Keeps seasonal domain targets by code. */
export interface SeasonalDomainTargetStore {
  find(code: string): SeasonalDomainTarget | undefined;
  save(item: SeasonalDomainTarget): void;
  remove(code: string): boolean;
  list(): SeasonalDomainTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalDomainTargetStore implements SeasonalDomainTargetStore {
  items: Map<string, SeasonalDomainTarget>;
  order: string[];

  constructor(items: Map<string, SeasonalDomainTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalDomainTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalDomainTarget): void {
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

  list(): SeasonalDomainTarget[] {
    const out: SeasonalDomainTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalDomainTargetStore(): SeasonalDomainTargetStore {
  return new MemorySeasonalDomainTargetStore(new Map<string, SeasonalDomainTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalDomainTargetStore implements SeasonalDomainTargetStore {
  inner: SeasonalDomainTargetStore;
  cache: cache.TtlCache<SeasonalDomainTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalDomainTargetStore,
    cacheValue: cache.TtlCache<SeasonalDomainTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalDomainTarget | undefined {
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

  save(item: SeasonalDomainTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalDomainTarget[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalDomainTargetStore(inner: SeasonalDomainTargetStore, ttl: number, clockValue: clock.Clock): SeasonalDomainTargetStore {
  return new CachedSeasonalDomainTargetStore(
    inner,
    cache.newTtlCache<SeasonalDomainTarget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal domain targets. Empty fields match all. */
export class SeasonalDomainTargetQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalDomainTarget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalDomainTarget[]): SeasonalDomainTarget[] {
    const matched = collections.filter(items, (candidate: SeasonalDomainTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalDomainTargets(store: SeasonalDomainTargetStore, query: SeasonalDomainTargetQuery): SeasonalDomainTarget[] {
  return query.apply(store.list());
}
