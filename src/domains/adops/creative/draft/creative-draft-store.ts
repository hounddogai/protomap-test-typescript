import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeDraft } from "./creative-draft.js";

/** Keeps creative drafts by code. */
export interface CreativeDraftStore {
  find(code: string): CreativeDraft | undefined;
  save(item: CreativeDraft): void;
  remove(code: string): boolean;
  list(): CreativeDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeDraftStore implements CreativeDraftStore {
  items: Map<string, CreativeDraft>;
  order: string[];

  constructor(items: Map<string, CreativeDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeDraft): void {
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

  list(): CreativeDraft[] {
    const out: CreativeDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeDraftStore(): CreativeDraftStore {
  return new MemoryCreativeDraftStore(new Map<string, CreativeDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeDraftStore implements CreativeDraftStore {
  inner: CreativeDraftStore;
  cache: cache.TtlCache<CreativeDraft>;
  hits: number;
  misses: number;

  constructor(inner: CreativeDraftStore, cacheValue: cache.TtlCache<CreativeDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeDraft | undefined {
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

  save(item: CreativeDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeDraft[] {
    return this.inner.list();
  }
}

export function newCachedCreativeDraftStore(inner: CreativeDraftStore, ttl: number, clockValue: clock.Clock): CreativeDraftStore {
  return new CachedCreativeDraftStore(inner, cache.newTtlCache<CreativeDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects creative drafts. Empty fields match all. */
export class CreativeDraftQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeDraft[]): CreativeDraft[] {
    const matched = collections.filter(items, (candidate: CreativeDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeDrafts(store: CreativeDraftStore, query: CreativeDraftQuery): CreativeDraft[] {
  return query.apply(store.list());
}
