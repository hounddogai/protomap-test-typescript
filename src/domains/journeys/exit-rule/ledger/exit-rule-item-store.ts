import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleItem } from "./exit-rule-item.js";

/** Keeps exit rule items by code. */
export interface ExitRuleItemStore {
  find(code: string): ExitRuleItem | undefined;
  save(item: ExitRuleItem): void;
  remove(code: string): boolean;
  list(): ExitRuleItem[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleItemStore implements ExitRuleItemStore {
  items: Map<string, ExitRuleItem>;
  order: string[];

  constructor(items: Map<string, ExitRuleItem>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleItem | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleItem): void {
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

  list(): ExitRuleItem[] {
    const out: ExitRuleItem[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleItemStore(): ExitRuleItemStore {
  return new MemoryExitRuleItemStore(new Map<string, ExitRuleItem>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleItemStore implements ExitRuleItemStore {
  inner: ExitRuleItemStore;
  cache: cache.TtlCache<ExitRuleItem>;
  hits: number;
  misses: number;

  constructor(inner: ExitRuleItemStore, cacheValue: cache.TtlCache<ExitRuleItem>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleItem | undefined {
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

  save(item: ExitRuleItem): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleItem[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleItemStore(inner: ExitRuleItemStore, ttl: number, clockValue: clock.Clock): ExitRuleItemStore {
  return new CachedExitRuleItemStore(inner, cache.newTtlCache<ExitRuleItem>(64, ttl, clockValue), 0, 0);
}

/** Selects exit rule items. Empty fields match all. */
export class ExitRuleItemQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleItem): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleItem[]): ExitRuleItem[] {
    const matched = collections.filter(items, (candidate: ExitRuleItem): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleItems(store: ExitRuleItemStore, query: ExitRuleItemQuery): ExitRuleItem[] {
  return query.apply(store.list());
}
