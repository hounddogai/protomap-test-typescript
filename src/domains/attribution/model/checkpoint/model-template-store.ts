import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelTemplate } from "./model-template.js";

/** Keeps model templates by code. */
export interface ModelTemplateStore {
  find(code: string): ModelTemplate | undefined;
  save(item: ModelTemplate): void;
  remove(code: string): boolean;
  list(): ModelTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelTemplateStore implements ModelTemplateStore {
  items: Map<string, ModelTemplate>;
  order: string[];

  constructor(items: Map<string, ModelTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelTemplate): void {
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

  list(): ModelTemplate[] {
    const out: ModelTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelTemplateStore(): ModelTemplateStore {
  return new MemoryModelTemplateStore(new Map<string, ModelTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelTemplateStore implements ModelTemplateStore {
  inner: ModelTemplateStore;
  cache: cache.TtlCache<ModelTemplate>;
  hits: number;
  misses: number;

  constructor(inner: ModelTemplateStore, cacheValue: cache.TtlCache<ModelTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelTemplate | undefined {
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

  save(item: ModelTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelTemplate[] {
    return this.inner.list();
  }
}

export function newCachedModelTemplateStore(inner: ModelTemplateStore, ttl: number, clockValue: clock.Clock): ModelTemplateStore {
  return new CachedModelTemplateStore(inner, cache.newTtlCache<ModelTemplate>(128, ttl, clockValue), 0, 0);
}

/** Selects model templates. Empty fields match all. */
export class ModelTemplateQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelTemplate[]): ModelTemplate[] {
    const matched = collections.filter(items, (candidate: ModelTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelTemplates(store: ModelTemplateStore, query: ModelTemplateQuery): ModelTemplate[] {
  return query.apply(store.list());
}
