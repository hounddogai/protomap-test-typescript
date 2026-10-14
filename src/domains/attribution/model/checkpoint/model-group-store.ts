import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelGroup } from "./model-group.js";

/** Keeps model groups by code. */
export interface ModelGroupStore {
  find(code: string): ModelGroup | undefined;
  save(item: ModelGroup): void;
  remove(code: string): boolean;
  list(): ModelGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelGroupStore implements ModelGroupStore {
  items: Map<string, ModelGroup>;
  order: string[];

  constructor(items: Map<string, ModelGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelGroup): void {
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

  list(): ModelGroup[] {
    const out: ModelGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelGroupStore(): ModelGroupStore {
  return new MemoryModelGroupStore(new Map<string, ModelGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelGroupStore implements ModelGroupStore {
  inner: ModelGroupStore;
  cache: cache.TtlCache<ModelGroup>;
  hits: number;
  misses: number;

  constructor(inner: ModelGroupStore, cacheValue: cache.TtlCache<ModelGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelGroup | undefined {
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

  save(item: ModelGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelGroup[] {
    return this.inner.list();
  }
}

export function newCachedModelGroupStore(inner: ModelGroupStore, ttl: number, clockValue: clock.Clock): ModelGroupStore {
  return new CachedModelGroupStore(inner, cache.newTtlCache<ModelGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects model groups. Empty fields match all. */
export class ModelGroupQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelGroup[]): ModelGroup[] {
    const matched = collections.filter(items, (candidate: ModelGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelGroups(store: ModelGroupStore, query: ModelGroupQuery): ModelGroup[] {
  return query.apply(store.list());
}
