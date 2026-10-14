import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionTemplate } from "./deflection-template.js";

/** Keeps deflection templates by code. */
export interface DeflectionTemplateStore {
  find(code: string): DeflectionTemplate | undefined;
  save(item: DeflectionTemplate): void;
  remove(code: string): boolean;
  list(): DeflectionTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionTemplateStore implements DeflectionTemplateStore {
  items: Map<string, DeflectionTemplate>;
  order: string[];

  constructor(items: Map<string, DeflectionTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionTemplate): void {
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

  list(): DeflectionTemplate[] {
    const out: DeflectionTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionTemplateStore(): DeflectionTemplateStore {
  return new MemoryDeflectionTemplateStore(new Map<string, DeflectionTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionTemplateStore implements DeflectionTemplateStore {
  inner: DeflectionTemplateStore;
  cache: cache.TtlCache<DeflectionTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionTemplateStore,
    cacheValue: cache.TtlCache<DeflectionTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionTemplate | undefined {
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

  save(item: DeflectionTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionTemplateStore(inner: DeflectionTemplateStore, ttl: number, clockValue: clock.Clock): DeflectionTemplateStore {
  return new CachedDeflectionTemplateStore(inner, cache.newTtlCache<DeflectionTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection templates. Empty fields match all. */
export class DeflectionTemplateQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionTemplate[]): DeflectionTemplate[] {
    const matched = collections.filter(items, (candidate: DeflectionTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionTemplates(store: DeflectionTemplateStore, query: DeflectionTemplateQuery): DeflectionTemplate[] {
  return query.apply(store.list());
}
