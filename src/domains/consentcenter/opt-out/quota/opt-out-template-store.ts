import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutTemplate } from "./opt-out-template.js";

/** Keeps opt out templates by code. */
export interface OptOutTemplateStore {
  find(code: string): OptOutTemplate | undefined;
  save(item: OptOutTemplate): void;
  remove(code: string): boolean;
  list(): OptOutTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutTemplateStore implements OptOutTemplateStore {
  items: Map<string, OptOutTemplate>;
  order: string[];

  constructor(items: Map<string, OptOutTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutTemplate): void {
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

  list(): OptOutTemplate[] {
    const out: OptOutTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutTemplateStore(): OptOutTemplateStore {
  return new MemoryOptOutTemplateStore(new Map<string, OptOutTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutTemplateStore implements OptOutTemplateStore {
  inner: OptOutTemplateStore;
  cache: cache.TtlCache<OptOutTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutTemplateStore,
    cacheValue: cache.TtlCache<OptOutTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutTemplate | undefined {
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

  save(item: OptOutTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutTemplate[] {
    return this.inner.list();
  }
}

export function newCachedOptOutTemplateStore(inner: OptOutTemplateStore, ttl: number, clockValue: clock.Clock): OptOutTemplateStore {
  return new CachedOptOutTemplateStore(inner, cache.newTtlCache<OptOutTemplate>(512, ttl, clockValue), 0, 0);
}

/** Selects opt out templates. Empty fields match all. */
export class OptOutTemplateQuery {
  segment: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutTemplate[]): OptOutTemplate[] {
    const matched = collections.filter(items, (candidate: OptOutTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutTemplates(store: OptOutTemplateStore, query: OptOutTemplateQuery): OptOutTemplate[] {
  return query.apply(store.list());
}
