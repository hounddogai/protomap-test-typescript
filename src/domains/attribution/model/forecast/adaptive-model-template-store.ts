import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveModelTemplate } from "./adaptive-model-template.js";

/** Keeps adaptive model templates by code. */
export interface AdaptiveModelTemplateStore {
  find(code: string): AdaptiveModelTemplate | undefined;
  save(item: AdaptiveModelTemplate): void;
  remove(code: string): boolean;
  list(): AdaptiveModelTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveModelTemplateStore implements AdaptiveModelTemplateStore {
  items: Map<string, AdaptiveModelTemplate>;
  order: string[];

  constructor(items: Map<string, AdaptiveModelTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveModelTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveModelTemplate): void {
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

  list(): AdaptiveModelTemplate[] {
    const out: AdaptiveModelTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveModelTemplateStore(): AdaptiveModelTemplateStore {
  return new MemoryAdaptiveModelTemplateStore(new Map<string, AdaptiveModelTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveModelTemplateStore implements AdaptiveModelTemplateStore {
  inner: AdaptiveModelTemplateStore;
  cache: cache.TtlCache<AdaptiveModelTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveModelTemplateStore,
    cacheValue: cache.TtlCache<AdaptiveModelTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveModelTemplate | undefined {
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

  save(item: AdaptiveModelTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveModelTemplate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveModelTemplateStore(inner: AdaptiveModelTemplateStore, ttl: number, clockValue: clock.Clock): AdaptiveModelTemplateStore {
  return new CachedAdaptiveModelTemplateStore(
    inner,
    cache.newTtlCache<AdaptiveModelTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive model templates. Empty fields match all. */
export class AdaptiveModelTemplateQuery {
  label: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCapacity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveModelTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveModelTemplate[]): AdaptiveModelTemplate[] {
    const matched = collections.filter(items, (candidate: AdaptiveModelTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveModelTemplates(store: AdaptiveModelTemplateStore, query: AdaptiveModelTemplateQuery): AdaptiveModelTemplate[] {
  return query.apply(store.list());
}
