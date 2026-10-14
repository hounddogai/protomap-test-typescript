import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaMapping } from "./sla-mapping.js";

/** Keeps sla mappings by code. */
export interface SlaMappingStore {
  find(code: string): SlaMapping | undefined;
  save(item: SlaMapping): void;
  remove(code: string): boolean;
  list(): SlaMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaMappingStore implements SlaMappingStore {
  items: Map<string, SlaMapping>;
  order: string[];

  constructor(items: Map<string, SlaMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaMapping): void {
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

  list(): SlaMapping[] {
    const out: SlaMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaMappingStore(): SlaMappingStore {
  return new MemorySlaMappingStore(new Map<string, SlaMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaMappingStore implements SlaMappingStore {
  inner: SlaMappingStore;
  cache: cache.TtlCache<SlaMapping>;
  hits: number;
  misses: number;

  constructor(inner: SlaMappingStore, cacheValue: cache.TtlCache<SlaMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaMapping | undefined {
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

  save(item: SlaMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaMapping[] {
    return this.inner.list();
  }
}

export function newCachedSlaMappingStore(inner: SlaMappingStore, ttl: number, clockValue: clock.Clock): SlaMappingStore {
  return new CachedSlaMappingStore(inner, cache.newTtlCache<SlaMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects sla mappings. Empty fields match all. */
export class SlaMappingQuery {
  segment: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minVersion: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaMapping): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaMapping[]): SlaMapping[] {
    const matched = collections.filter(items, (candidate: SlaMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaMappings(store: SlaMappingStore, query: SlaMappingQuery): SlaMapping[] {
  return query.apply(store.list());
}
