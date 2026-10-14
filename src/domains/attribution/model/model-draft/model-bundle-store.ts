import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelBundle } from "./model-bundle.js";

/** Keeps model bundles by code. */
export interface ModelBundleStore {
  find(code: string): ModelBundle | undefined;
  save(item: ModelBundle): void;
  remove(code: string): boolean;
  list(): ModelBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelBundleStore implements ModelBundleStore {
  items: Map<string, ModelBundle>;
  order: string[];

  constructor(items: Map<string, ModelBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelBundle): void {
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

  list(): ModelBundle[] {
    const out: ModelBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelBundleStore(): ModelBundleStore {
  return new MemoryModelBundleStore(new Map<string, ModelBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelBundleStore implements ModelBundleStore {
  inner: ModelBundleStore;
  cache: cache.TtlCache<ModelBundle>;
  hits: number;
  misses: number;

  constructor(inner: ModelBundleStore, cacheValue: cache.TtlCache<ModelBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelBundle | undefined {
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

  save(item: ModelBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelBundle[] {
    return this.inner.list();
  }
}

export function newCachedModelBundleStore(inner: ModelBundleStore, ttl: number, clockValue: clock.Clock): ModelBundleStore {
  return new CachedModelBundleStore(inner, cache.newTtlCache<ModelBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects model bundles. Empty fields match all. */
export class ModelBundleQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelBundle[]): ModelBundle[] {
    const matched = collections.filter(items, (candidate: ModelBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelBundles(store: ModelBundleStore, query: ModelBundleQuery): ModelBundle[] {
  return query.apply(store.list());
}
