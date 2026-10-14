import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalMapping } from "./approval-mapping.js";

/** Keeps approval mappings by code. */
export interface ApprovalMappingStore {
  find(code: string): ApprovalMapping | undefined;
  save(item: ApprovalMapping): void;
  remove(code: string): boolean;
  list(): ApprovalMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalMappingStore implements ApprovalMappingStore {
  items: Map<string, ApprovalMapping>;
  order: string[];

  constructor(items: Map<string, ApprovalMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalMapping): void {
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

  list(): ApprovalMapping[] {
    const out: ApprovalMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalMappingStore(): ApprovalMappingStore {
  return new MemoryApprovalMappingStore(new Map<string, ApprovalMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalMappingStore implements ApprovalMappingStore {
  inner: ApprovalMappingStore;
  cache: cache.TtlCache<ApprovalMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalMappingStore,
    cacheValue: cache.TtlCache<ApprovalMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalMapping | undefined {
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

  save(item: ApprovalMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalMapping[] {
    return this.inner.list();
  }
}

export function newCachedApprovalMappingStore(inner: ApprovalMappingStore, ttl: number, clockValue: clock.Clock): ApprovalMappingStore {
  return new CachedApprovalMappingStore(inner, cache.newTtlCache<ApprovalMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects approval mappings. Empty fields match all. */
export class ApprovalMappingQuery {
  utmSource: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCapacity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalMapping): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalMapping[]): ApprovalMapping[] {
    const matched = collections.filter(items, (candidate: ApprovalMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalMappings(store: ApprovalMappingStore, query: ApprovalMappingQuery): ApprovalMapping[] {
  return query.apply(store.list());
}
