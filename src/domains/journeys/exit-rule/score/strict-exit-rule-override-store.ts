import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictExitRuleOverride } from "./strict-exit-rule-override.js";

/** Keeps strict exit rule overrides by code. */
export interface StrictExitRuleOverrideStore {
  find(code: string): StrictExitRuleOverride | undefined;
  save(item: StrictExitRuleOverride): void;
  remove(code: string): boolean;
  list(): StrictExitRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictExitRuleOverrideStore implements StrictExitRuleOverrideStore {
  items: Map<string, StrictExitRuleOverride>;
  order: string[];

  constructor(items: Map<string, StrictExitRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictExitRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictExitRuleOverride): void {
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

  list(): StrictExitRuleOverride[] {
    const out: StrictExitRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictExitRuleOverrideStore(): StrictExitRuleOverrideStore {
  return new MemoryStrictExitRuleOverrideStore(new Map<string, StrictExitRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictExitRuleOverrideStore implements StrictExitRuleOverrideStore {
  inner: StrictExitRuleOverrideStore;
  cache: cache.TtlCache<StrictExitRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictExitRuleOverrideStore,
    cacheValue: cache.TtlCache<StrictExitRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictExitRuleOverride | undefined {
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

  save(item: StrictExitRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictExitRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedStrictExitRuleOverrideStore(inner: StrictExitRuleOverrideStore, ttl: number, clockValue: clock.Clock): StrictExitRuleOverrideStore {
  return new CachedStrictExitRuleOverrideStore(
    inner,
    cache.newTtlCache<StrictExitRuleOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict exit rule overrides. Empty fields match all. */
export class StrictExitRuleOverrideQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictExitRuleOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictExitRuleOverride[]): StrictExitRuleOverride[] {
    const matched = collections.filter(items, (candidate: StrictExitRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictExitRuleOverrides(store: StrictExitRuleOverrideStore, query: StrictExitRuleOverrideQuery): StrictExitRuleOverride[] {
  return query.apply(store.list());
}
