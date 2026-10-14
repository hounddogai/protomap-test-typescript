import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleBundle } from "./exit-rule-bundle.js";

/** Keeps exit rule bundles by code. */
export interface ExitRuleBundleStore {
  find(code: string): ExitRuleBundle | undefined;
  save(item: ExitRuleBundle): void;
  remove(code: string): boolean;
  list(): ExitRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleBundleStore implements ExitRuleBundleStore {
  items: Map<string, ExitRuleBundle>;
  order: string[];

  constructor(items: Map<string, ExitRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleBundle): void {
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

  list(): ExitRuleBundle[] {
    const out: ExitRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleBundleStore(): ExitRuleBundleStore {
  return new MemoryExitRuleBundleStore(new Map<string, ExitRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleBundleStore implements ExitRuleBundleStore {
  inner: ExitRuleBundleStore;
  cache: cache.TtlCache<ExitRuleBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleBundleStore,
    cacheValue: cache.TtlCache<ExitRuleBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleBundle | undefined {
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

  save(item: ExitRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleBundleStore(inner: ExitRuleBundleStore, ttl: number, clockValue: clock.Clock): ExitRuleBundleStore {
  return new CachedExitRuleBundleStore(inner, cache.newTtlCache<ExitRuleBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects exit rule bundles. Empty fields match all. */
export class ExitRuleBundleQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleBundle[]): ExitRuleBundle[] {
    const matched = collections.filter(items, (candidate: ExitRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleBundles(store: ExitRuleBundleStore, query: ExitRuleBundleQuery): ExitRuleBundle[] {
  return query.apply(store.list());
}
