import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathMapping } from "./path-mapping.js";

/** Keeps path mappings by code. */
export interface PathMappingStore {
  find(code: string): PathMapping | undefined;
  save(item: PathMapping): void;
  remove(code: string): boolean;
  list(): PathMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathMappingStore implements PathMappingStore {
  items: Map<string, PathMapping>;
  order: string[];

  constructor(items: Map<string, PathMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathMapping): void {
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

  list(): PathMapping[] {
    const out: PathMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathMappingStore(): PathMappingStore {
  return new MemoryPathMappingStore(new Map<string, PathMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathMappingStore implements PathMappingStore {
  inner: PathMappingStore;
  cache: cache.TtlCache<PathMapping>;
  hits: number;
  misses: number;

  constructor(inner: PathMappingStore, cacheValue: cache.TtlCache<PathMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathMapping | undefined {
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

  save(item: PathMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathMapping[] {
    return this.inner.list();
  }
}

export function newCachedPathMappingStore(inner: PathMappingStore, ttl: number, clockValue: clock.Clock): PathMappingStore {
  return new CachedPathMappingStore(inner, cache.newTtlCache<PathMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects path mappings. Empty fields match all. */
export class PathMappingQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathMapping): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathMapping[]): PathMapping[] {
    const matched = collections.filter(items, (candidate: PathMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathMappings(store: PathMappingStore, query: PathMappingQuery): PathMapping[] {
  return query.apply(store.list());
}
