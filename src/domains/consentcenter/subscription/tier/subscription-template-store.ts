import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionTemplate } from "./subscription-template.js";

/** Keeps subscription templates by code. */
export interface SubscriptionTemplateStore {
  find(code: string): SubscriptionTemplate | undefined;
  save(item: SubscriptionTemplate): void;
  remove(code: string): boolean;
  list(): SubscriptionTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionTemplateStore implements SubscriptionTemplateStore {
  items: Map<string, SubscriptionTemplate>;
  order: string[];

  constructor(items: Map<string, SubscriptionTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionTemplate): void {
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

  list(): SubscriptionTemplate[] {
    const out: SubscriptionTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionTemplateStore(): SubscriptionTemplateStore {
  return new MemorySubscriptionTemplateStore(new Map<string, SubscriptionTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionTemplateStore implements SubscriptionTemplateStore {
  inner: SubscriptionTemplateStore;
  cache: cache.TtlCache<SubscriptionTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionTemplateStore,
    cacheValue: cache.TtlCache<SubscriptionTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionTemplate | undefined {
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

  save(item: SubscriptionTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionTemplate[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionTemplateStore(inner: SubscriptionTemplateStore, ttl: number, clockValue: clock.Clock): SubscriptionTemplateStore {
  return new CachedSubscriptionTemplateStore(inner, cache.newTtlCache<SubscriptionTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects subscription templates. Empty fields match all. */
export class SubscriptionTemplateQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionTemplate[]): SubscriptionTemplate[] {
    const matched = collections.filter(items, (candidate: SubscriptionTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionTemplates(store: SubscriptionTemplateStore, query: SubscriptionTemplateQuery): SubscriptionTemplate[] {
  return query.apply(store.list());
}
