import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictExitRuleItem } from "./strict-exit-rule-item.js";

/** Keeps strict exit rule items by code. */
export interface StrictExitRuleItemStore {
  find(code: string): StrictExitRuleItem | undefined;
  save(item: StrictExitRuleItem): void;
  remove(code: string): boolean;
  list(): StrictExitRuleItem[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictExitRuleItemStore implements StrictExitRuleItemStore {
  items: Map<string, StrictExitRuleItem>;
  order: string[];

  constructor(items: Map<string, StrictExitRuleItem>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictExitRuleItem | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictExitRuleItem): void {
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

  list(): StrictExitRuleItem[] {
    const out: StrictExitRuleItem[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictExitRuleItemStore(): StrictExitRuleItemStore {
  return new MemoryStrictExitRuleItemStore(new Map<string, StrictExitRuleItem>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictExitRuleItemStore implements StrictExitRuleItemStore {
  inner: StrictExitRuleItemStore;
  cache: cache.TtlCache<StrictExitRuleItem>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictExitRuleItemStore,
    cacheValue: cache.TtlCache<StrictExitRuleItem>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictExitRuleItem | undefined {
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

  save(item: StrictExitRuleItem): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictExitRuleItem[] {
    return this.inner.list();
  }
}

export function newCachedStrictExitRuleItemStore(inner: StrictExitRuleItemStore, ttl: number, clockValue: clock.Clock): StrictExitRuleItemStore {
  return new CachedStrictExitRuleItemStore(inner, cache.newTtlCache<StrictExitRuleItem>(256, ttl, clockValue), 0, 0);
}

/** Selects strict exit rule items. Empty fields match all. */
export class StrictExitRuleItemQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictExitRuleItem): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictExitRuleItem[]): StrictExitRuleItem[] {
    const matched = collections.filter(items, (candidate: StrictExitRuleItem): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictExitRuleItems(store: StrictExitRuleItemStore, query: StrictExitRuleItemQuery): StrictExitRuleItem[] {
  return query.apply(store.list());
}
