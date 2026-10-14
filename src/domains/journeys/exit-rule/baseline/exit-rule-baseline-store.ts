import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleBaseline } from "./exit-rule-baseline.js";

/** Keeps exit rule baselines by code. */
export interface ExitRuleBaselineStore {
  find(code: string): ExitRuleBaseline | undefined;
  save(item: ExitRuleBaseline): void;
  remove(code: string): boolean;
  list(): ExitRuleBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleBaselineStore implements ExitRuleBaselineStore {
  items: Map<string, ExitRuleBaseline>;
  order: string[];

  constructor(items: Map<string, ExitRuleBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleBaseline): void {
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

  list(): ExitRuleBaseline[] {
    const out: ExitRuleBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleBaselineStore(): ExitRuleBaselineStore {
  return new MemoryExitRuleBaselineStore(new Map<string, ExitRuleBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleBaselineStore implements ExitRuleBaselineStore {
  inner: ExitRuleBaselineStore;
  cache: cache.TtlCache<ExitRuleBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleBaselineStore,
    cacheValue: cache.TtlCache<ExitRuleBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleBaseline | undefined {
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

  save(item: ExitRuleBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleBaseline[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleBaselineStore(inner: ExitRuleBaselineStore, ttl: number, clockValue: clock.Clock): ExitRuleBaselineStore {
  return new CachedExitRuleBaselineStore(inner, cache.newTtlCache<ExitRuleBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects exit rule baselines. Empty fields match all. */
export class ExitRuleBaselineQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleBaseline[]): ExitRuleBaseline[] {
    const matched = collections.filter(items, (candidate: ExitRuleBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleBaselines(store: ExitRuleBaselineStore, query: ExitRuleBaselineQuery): ExitRuleBaseline[] {
  return query.apply(store.list());
}
