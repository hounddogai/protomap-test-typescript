import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleOverride } from "./reward-rule-override.js";

/** Keeps reward rule overrides by code. */
export interface RewardRuleOverrideStore {
  find(code: string): RewardRuleOverride | undefined;
  save(item: RewardRuleOverride): void;
  remove(code: string): boolean;
  list(): RewardRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleOverrideStore implements RewardRuleOverrideStore {
  items: Map<string, RewardRuleOverride>;
  order: string[];

  constructor(items: Map<string, RewardRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleOverride): void {
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

  list(): RewardRuleOverride[] {
    const out: RewardRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleOverrideStore(): RewardRuleOverrideStore {
  return new MemoryRewardRuleOverrideStore(new Map<string, RewardRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleOverrideStore implements RewardRuleOverrideStore {
  inner: RewardRuleOverrideStore;
  cache: cache.TtlCache<RewardRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleOverrideStore,
    cacheValue: cache.TtlCache<RewardRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleOverride | undefined {
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

  save(item: RewardRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleOverrideStore(inner: RewardRuleOverrideStore, ttl: number, clockValue: clock.Clock): RewardRuleOverrideStore {
  return new CachedRewardRuleOverrideStore(inner, cache.newTtlCache<RewardRuleOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects reward rule overrides. Empty fields match all. */
export class RewardRuleOverrideQuery {
  region: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRevision: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleOverride): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleOverride[]): RewardRuleOverride[] {
    const matched = collections.filter(items, (candidate: RewardRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleOverrides(store: RewardRuleOverrideStore, query: RewardRuleOverrideQuery): RewardRuleOverride[] {
  return query.apply(store.list());
}
