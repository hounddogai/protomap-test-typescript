import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelManifest } from "./model-manifest.js";

/** Keeps model manifests by code. */
export interface ModelManifestStore {
  find(code: string): ModelManifest | undefined;
  save(item: ModelManifest): void;
  remove(code: string): boolean;
  list(): ModelManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelManifestStore implements ModelManifestStore {
  items: Map<string, ModelManifest>;
  order: string[];

  constructor(items: Map<string, ModelManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelManifest): void {
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

  list(): ModelManifest[] {
    const out: ModelManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelManifestStore(): ModelManifestStore {
  return new MemoryModelManifestStore(new Map<string, ModelManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelManifestStore implements ModelManifestStore {
  inner: ModelManifestStore;
  cache: cache.TtlCache<ModelManifest>;
  hits: number;
  misses: number;

  constructor(inner: ModelManifestStore, cacheValue: cache.TtlCache<ModelManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelManifest | undefined {
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

  save(item: ModelManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelManifest[] {
    return this.inner.list();
  }
}

export function newCachedModelManifestStore(inner: ModelManifestStore, ttl: number, clockValue: clock.Clock): ModelManifestStore {
  return new CachedModelManifestStore(inner, cache.newTtlCache<ModelManifest>(64, ttl, clockValue), 0, 0);
}

/** Selects model manifests. Empty fields match all. */
export class ModelManifestQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelManifest[]): ModelManifest[] {
    const matched = collections.filter(items, (candidate: ModelManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelManifests(store: ModelManifestStore, query: ModelManifestQuery): ModelManifest[] {
  return query.apply(store.list());
}
