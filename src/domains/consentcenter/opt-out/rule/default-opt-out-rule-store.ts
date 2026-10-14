import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultOptOutRule } from "./default-opt-out-rule.js";

/** Keeps default opt out rules by code. */
export interface DefaultOptOutRuleStore {
  find(code: string): DefaultOptOutRule | undefined;
  save(item: DefaultOptOutRule): void;
  remove(code: string): boolean;
  list(): DefaultOptOutRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultOptOutRuleStore implements DefaultOptOutRuleStore {
  items: Map<string, DefaultOptOutRule>;
  order: string[];

  constructor(items: Map<string, DefaultOptOutRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultOptOutRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultOptOutRule): void {
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

  list(): DefaultOptOutRule[] {
    const out: DefaultOptOutRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultOptOutRuleStore(): DefaultOptOutRuleStore {
  return new MemoryDefaultOptOutRuleStore(new Map<string, DefaultOptOutRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultOptOutRuleStore implements DefaultOptOutRuleStore {
  inner: DefaultOptOutRuleStore;
  cache: cache.TtlCache<DefaultOptOutRule>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultOptOutRuleStore,
    cacheValue: cache.TtlCache<DefaultOptOutRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultOptOutRule | undefined {
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

  save(item: DefaultOptOutRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultOptOutRule[] {
    return this.inner.list();
  }
}

export function newCachedDefaultOptOutRuleStore(inner: DefaultOptOutRuleStore, ttl: number, clockValue: clock.Clock): DefaultOptOutRuleStore {
  return new CachedDefaultOptOutRuleStore(inner, cache.newTtlCache<DefaultOptOutRule>(256, ttl, clockValue), 0, 0);
}

/** Selects default opt out rules. Empty fields match all. */
export class DefaultOptOutRuleQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultOptOutRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultOptOutRule[]): DefaultOptOutRule[] {
    const matched = collections.filter(items, (candidate: DefaultOptOutRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultOptOutRules(store: DefaultOptOutRuleStore, query: DefaultOptOutRuleQuery): DefaultOptOutRule[] {
  return query.apply(store.list());
}
