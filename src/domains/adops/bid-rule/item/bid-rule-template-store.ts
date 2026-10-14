import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleTemplate } from "./bid-rule-template.js";

/** Keeps bid rule templates by code. */
export interface BidRuleTemplateStore {
  find(code: string): BidRuleTemplate | undefined;
  save(item: BidRuleTemplate): void;
  remove(code: string): boolean;
  list(): BidRuleTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleTemplateStore implements BidRuleTemplateStore {
  items: Map<string, BidRuleTemplate>;
  order: string[];

  constructor(items: Map<string, BidRuleTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleTemplate): void {
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

  list(): BidRuleTemplate[] {
    const out: BidRuleTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleTemplateStore(): BidRuleTemplateStore {
  return new MemoryBidRuleTemplateStore(new Map<string, BidRuleTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleTemplateStore implements BidRuleTemplateStore {
  inner: BidRuleTemplateStore;
  cache: cache.TtlCache<BidRuleTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleTemplateStore,
    cacheValue: cache.TtlCache<BidRuleTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleTemplate | undefined {
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

  save(item: BidRuleTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleTemplate[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleTemplateStore(inner: BidRuleTemplateStore, ttl: number, clockValue: clock.Clock): BidRuleTemplateStore {
  return new CachedBidRuleTemplateStore(inner, cache.newTtlCache<BidRuleTemplate>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule templates. Empty fields match all. */
export class BidRuleTemplateQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleTemplate[]): BidRuleTemplate[] {
    const matched = collections.filter(items, (candidate: BidRuleTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleTemplates(store: BidRuleTemplateStore, query: BidRuleTemplateQuery): BidRuleTemplate[] {
  return query.apply(store.list());
}
