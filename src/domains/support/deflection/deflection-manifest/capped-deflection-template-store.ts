import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDeflectionTemplate } from "./capped-deflection-template.js";

/** Keeps capped deflection templates by code. */
export interface CappedDeflectionTemplateStore {
  find(code: string): CappedDeflectionTemplate | undefined;
  save(item: CappedDeflectionTemplate): void;
  remove(code: string): boolean;
  list(): CappedDeflectionTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDeflectionTemplateStore implements CappedDeflectionTemplateStore {
  items: Map<string, CappedDeflectionTemplate>;
  order: string[];

  constructor(items: Map<string, CappedDeflectionTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDeflectionTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDeflectionTemplate): void {
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

  list(): CappedDeflectionTemplate[] {
    const out: CappedDeflectionTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDeflectionTemplateStore(): CappedDeflectionTemplateStore {
  return new MemoryCappedDeflectionTemplateStore(new Map<string, CappedDeflectionTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDeflectionTemplateStore implements CappedDeflectionTemplateStore {
  inner: CappedDeflectionTemplateStore;
  cache: cache.TtlCache<CappedDeflectionTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDeflectionTemplateStore,
    cacheValue: cache.TtlCache<CappedDeflectionTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDeflectionTemplate | undefined {
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

  save(item: CappedDeflectionTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDeflectionTemplate[] {
    return this.inner.list();
  }
}

export function newCachedCappedDeflectionTemplateStore(inner: CappedDeflectionTemplateStore, ttl: number, clockValue: clock.Clock): CappedDeflectionTemplateStore {
  return new CachedCappedDeflectionTemplateStore(
    inner,
    cache.newTtlCache<CappedDeflectionTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped deflection templates. Empty fields match all. */
export class CappedDeflectionTemplateQuery {
  locale: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDeflectionTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDeflectionTemplate[]): CappedDeflectionTemplate[] {
    const matched = collections.filter(items, (candidate: CappedDeflectionTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDeflectionTemplates(store: CappedDeflectionTemplateStore, query: CappedDeflectionTemplateQuery): CappedDeflectionTemplate[] {
  return query.apply(store.list());
}
