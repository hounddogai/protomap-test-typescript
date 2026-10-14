import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeGroup } from "./creative-group.js";

/** Keeps creative groups by code. */
export interface CreativeGroupStore {
  find(code: string): CreativeGroup | undefined;
  save(item: CreativeGroup): void;
  remove(code: string): boolean;
  list(): CreativeGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeGroupStore implements CreativeGroupStore {
  items: Map<string, CreativeGroup>;
  order: string[];

  constructor(items: Map<string, CreativeGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeGroup): void {
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

  list(): CreativeGroup[] {
    const out: CreativeGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeGroupStore(): CreativeGroupStore {
  return new MemoryCreativeGroupStore(new Map<string, CreativeGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeGroupStore implements CreativeGroupStore {
  inner: CreativeGroupStore;
  cache: cache.TtlCache<CreativeGroup>;
  hits: number;
  misses: number;

  constructor(inner: CreativeGroupStore, cacheValue: cache.TtlCache<CreativeGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeGroup | undefined {
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

  save(item: CreativeGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeGroup[] {
    return this.inner.list();
  }
}

export function newCachedCreativeGroupStore(inner: CreativeGroupStore, ttl: number, clockValue: clock.Clock): CreativeGroupStore {
  return new CachedCreativeGroupStore(inner, cache.newTtlCache<CreativeGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects creative groups. Empty fields match all. */
export class CreativeGroupQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeGroup[]): CreativeGroup[] {
    const matched = collections.filter(items, (candidate: CreativeGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeGroups(store: CreativeGroupStore, query: CreativeGroupQuery): CreativeGroup[] {
  return query.apply(store.list());
}
