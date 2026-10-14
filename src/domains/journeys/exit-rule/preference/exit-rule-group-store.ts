import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleGroup } from "./exit-rule-group.js";

/** Keeps exit rule groups by code. */
export interface ExitRuleGroupStore {
  find(code: string): ExitRuleGroup | undefined;
  save(item: ExitRuleGroup): void;
  remove(code: string): boolean;
  list(): ExitRuleGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleGroupStore implements ExitRuleGroupStore {
  items: Map<string, ExitRuleGroup>;
  order: string[];

  constructor(items: Map<string, ExitRuleGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleGroup): void {
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

  list(): ExitRuleGroup[] {
    const out: ExitRuleGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleGroupStore(): ExitRuleGroupStore {
  return new MemoryExitRuleGroupStore(new Map<string, ExitRuleGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleGroupStore implements ExitRuleGroupStore {
  inner: ExitRuleGroupStore;
  cache: cache.TtlCache<ExitRuleGroup>;
  hits: number;
  misses: number;

  constructor(inner: ExitRuleGroupStore, cacheValue: cache.TtlCache<ExitRuleGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleGroup | undefined {
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

  save(item: ExitRuleGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleGroup[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleGroupStore(inner: ExitRuleGroupStore, ttl: number, clockValue: clock.Clock): ExitRuleGroupStore {
  return new CachedExitRuleGroupStore(inner, cache.newTtlCache<ExitRuleGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects exit rule groups. Empty fields match all. */
export class ExitRuleGroupQuery {
  unit: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleGroup): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleGroup[]): ExitRuleGroup[] {
    const matched = collections.filter(items, (candidate: ExitRuleGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleGroups(store: ExitRuleGroupStore, query: ExitRuleGroupQuery): ExitRuleGroup[] {
  return query.apply(store.list());
}
