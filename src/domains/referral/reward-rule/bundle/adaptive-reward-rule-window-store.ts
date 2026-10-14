import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleWindow } from "./adaptive-reward-rule-window.js";

/** Keeps adaptive reward rule windows by code. */
export interface AdaptiveRewardRuleWindowStore {
  find(code: string): AdaptiveRewardRuleWindow | undefined;
  save(item: AdaptiveRewardRuleWindow): void;
  remove(code: string): boolean;
  list(): AdaptiveRewardRuleWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveRewardRuleWindowStore implements AdaptiveRewardRuleWindowStore {
  items: Map<string, AdaptiveRewardRuleWindow>;
  order: string[];

  constructor(items: Map<string, AdaptiveRewardRuleWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveRewardRuleWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveRewardRuleWindow): void {
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

  list(): AdaptiveRewardRuleWindow[] {
    const out: AdaptiveRewardRuleWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveRewardRuleWindowStore(): AdaptiveRewardRuleWindowStore {
  return new MemoryAdaptiveRewardRuleWindowStore(new Map<string, AdaptiveRewardRuleWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveRewardRuleWindowStore implements AdaptiveRewardRuleWindowStore {
  inner: AdaptiveRewardRuleWindowStore;
  cache: cache.TtlCache<AdaptiveRewardRuleWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveRewardRuleWindowStore,
    cacheValue: cache.TtlCache<AdaptiveRewardRuleWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveRewardRuleWindow | undefined {
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

  save(item: AdaptiveRewardRuleWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveRewardRuleWindow[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveRewardRuleWindowStore(inner: AdaptiveRewardRuleWindowStore, ttl: number, clockValue: clock.Clock): AdaptiveRewardRuleWindowStore {
  return new CachedAdaptiveRewardRuleWindowStore(
    inner,
    cache.newTtlCache<AdaptiveRewardRuleWindow>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive reward rule windows. Empty fields match all. */
export class AdaptiveRewardRuleWindowQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveRewardRuleWindow): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveRewardRuleWindow[]): AdaptiveRewardRuleWindow[] {
    const matched = collections.filter(items, (candidate: AdaptiveRewardRuleWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveRewardRuleWindows(store: AdaptiveRewardRuleWindowStore, query: AdaptiveRewardRuleWindowQuery): AdaptiveRewardRuleWindow[] {
  return query.apply(store.list());
}
