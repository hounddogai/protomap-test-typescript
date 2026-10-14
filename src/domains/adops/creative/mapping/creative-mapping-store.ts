import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeMapping } from "./creative-mapping.js";

/** Keeps creative mappings by code. */
export interface CreativeMappingStore {
  find(code: string): CreativeMapping | undefined;
  save(item: CreativeMapping): void;
  remove(code: string): boolean;
  list(): CreativeMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeMappingStore implements CreativeMappingStore {
  items: Map<string, CreativeMapping>;
  order: string[];

  constructor(items: Map<string, CreativeMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeMapping): void {
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

  list(): CreativeMapping[] {
    const out: CreativeMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeMappingStore(): CreativeMappingStore {
  return new MemoryCreativeMappingStore(new Map<string, CreativeMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeMappingStore implements CreativeMappingStore {
  inner: CreativeMappingStore;
  cache: cache.TtlCache<CreativeMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeMappingStore,
    cacheValue: cache.TtlCache<CreativeMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeMapping | undefined {
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

  save(item: CreativeMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeMapping[] {
    return this.inner.list();
  }
}

export function newCachedCreativeMappingStore(inner: CreativeMappingStore, ttl: number, clockValue: clock.Clock): CreativeMappingStore {
  return new CachedCreativeMappingStore(inner, cache.newTtlCache<CreativeMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects creative mappings. Empty fields match all. */
export class CreativeMappingQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeMapping[]): CreativeMapping[] {
    const matched = collections.filter(items, (candidate: CreativeMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeMappings(store: CreativeMappingStore, query: CreativeMappingQuery): CreativeMapping[] {
  return query.apply(store.list());
}
