import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryMentionRule } from "./primary-mention-rule.js";

/** Keeps primary mention rules by code. */
export interface PrimaryMentionRuleStore {
  find(code: string): PrimaryMentionRule | undefined;
  save(item: PrimaryMentionRule): void;
  remove(code: string): boolean;
  list(): PrimaryMentionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryMentionRuleStore implements PrimaryMentionRuleStore {
  items: Map<string, PrimaryMentionRule>;
  order: string[];

  constructor(items: Map<string, PrimaryMentionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryMentionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryMentionRule): void {
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

  list(): PrimaryMentionRule[] {
    const out: PrimaryMentionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryMentionRuleStore(): PrimaryMentionRuleStore {
  return new MemoryPrimaryMentionRuleStore(new Map<string, PrimaryMentionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryMentionRuleStore implements PrimaryMentionRuleStore {
  inner: PrimaryMentionRuleStore;
  cache: cache.TtlCache<PrimaryMentionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryMentionRuleStore,
    cacheValue: cache.TtlCache<PrimaryMentionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryMentionRule | undefined {
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

  save(item: PrimaryMentionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryMentionRule[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryMentionRuleStore(inner: PrimaryMentionRuleStore, ttl: number, clockValue: clock.Clock): PrimaryMentionRuleStore {
  return new CachedPrimaryMentionRuleStore(inner, cache.newTtlCache<PrimaryMentionRule>(512, ttl, clockValue), 0, 0);
}

/** Selects primary mention rules. Empty fields match all. */
export class PrimaryMentionRuleQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryMentionRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryMentionRule[]): PrimaryMentionRule[] {
    const matched = collections.filter(items, (candidate: PrimaryMentionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryMentionRules(store: PrimaryMentionRuleStore, query: PrimaryMentionRuleQuery): PrimaryMentionRule[] {
  return query.apply(store.list());
}
