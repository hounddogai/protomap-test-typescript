import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelTemplate } from "./funnel-template.js";

/** Keeps funnel templates by code. */
export interface FunnelTemplateStore {
  find(code: string): FunnelTemplate | undefined;
  save(item: FunnelTemplate): void;
  remove(code: string): boolean;
  list(): FunnelTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelTemplateStore implements FunnelTemplateStore {
  items: Map<string, FunnelTemplate>;
  order: string[];

  constructor(items: Map<string, FunnelTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelTemplate): void {
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

  list(): FunnelTemplate[] {
    const out: FunnelTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelTemplateStore(): FunnelTemplateStore {
  return new MemoryFunnelTemplateStore(new Map<string, FunnelTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelTemplateStore implements FunnelTemplateStore {
  inner: FunnelTemplateStore;
  cache: cache.TtlCache<FunnelTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelTemplateStore,
    cacheValue: cache.TtlCache<FunnelTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelTemplate | undefined {
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

  save(item: FunnelTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelTemplate[] {
    return this.inner.list();
  }
}

export function newCachedFunnelTemplateStore(inner: FunnelTemplateStore, ttl: number, clockValue: clock.Clock): FunnelTemplateStore {
  return new CachedFunnelTemplateStore(inner, cache.newTtlCache<FunnelTemplate>(512, ttl, clockValue), 0, 0);
}

/** Selects funnel templates. Empty fields match all. */
export class FunnelTemplateQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelTemplate[]): FunnelTemplate[] {
    const matched = collections.filter(items, (candidate: FunnelTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelTemplates(store: FunnelTemplateStore, query: FunnelTemplateQuery): FunnelTemplate[] {
  return query.apply(store.list());
}
