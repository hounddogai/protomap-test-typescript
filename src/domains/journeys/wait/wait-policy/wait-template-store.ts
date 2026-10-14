import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitTemplate } from "./wait-template.js";

/** Keeps wait templates by code. */
export interface WaitTemplateStore {
  find(code: string): WaitTemplate | undefined;
  save(item: WaitTemplate): void;
  remove(code: string): boolean;
  list(): WaitTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitTemplateStore implements WaitTemplateStore {
  items: Map<string, WaitTemplate>;
  order: string[];

  constructor(items: Map<string, WaitTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitTemplate): void {
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

  list(): WaitTemplate[] {
    const out: WaitTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitTemplateStore(): WaitTemplateStore {
  return new MemoryWaitTemplateStore(new Map<string, WaitTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitTemplateStore implements WaitTemplateStore {
  inner: WaitTemplateStore;
  cache: cache.TtlCache<WaitTemplate>;
  hits: number;
  misses: number;

  constructor(inner: WaitTemplateStore, cacheValue: cache.TtlCache<WaitTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitTemplate | undefined {
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

  save(item: WaitTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitTemplate[] {
    return this.inner.list();
  }
}

export function newCachedWaitTemplateStore(inner: WaitTemplateStore, ttl: number, clockValue: clock.Clock): WaitTemplateStore {
  return new CachedWaitTemplateStore(inner, cache.newTtlCache<WaitTemplate>(512, ttl, clockValue), 0, 0);
}

/** Selects wait templates. Empty fields match all. */
export class WaitTemplateQuery {
  source: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCost: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitTemplate[]): WaitTemplate[] {
    const matched = collections.filter(items, (candidate: WaitTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitTemplates(store: WaitTemplateStore, query: WaitTemplateQuery): WaitTemplate[] {
  return query.apply(store.list());
}
