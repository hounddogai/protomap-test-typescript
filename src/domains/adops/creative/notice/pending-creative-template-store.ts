import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCreativeTemplate } from "./pending-creative-template.js";

/** Keeps pending creative templates by code. */
export interface PendingCreativeTemplateStore {
  find(code: string): PendingCreativeTemplate | undefined;
  save(item: PendingCreativeTemplate): void;
  remove(code: string): boolean;
  list(): PendingCreativeTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCreativeTemplateStore implements PendingCreativeTemplateStore {
  items: Map<string, PendingCreativeTemplate>;
  order: string[];

  constructor(items: Map<string, PendingCreativeTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCreativeTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCreativeTemplate): void {
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

  list(): PendingCreativeTemplate[] {
    const out: PendingCreativeTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCreativeTemplateStore(): PendingCreativeTemplateStore {
  return new MemoryPendingCreativeTemplateStore(new Map<string, PendingCreativeTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCreativeTemplateStore implements PendingCreativeTemplateStore {
  inner: PendingCreativeTemplateStore;
  cache: cache.TtlCache<PendingCreativeTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCreativeTemplateStore,
    cacheValue: cache.TtlCache<PendingCreativeTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCreativeTemplate | undefined {
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

  save(item: PendingCreativeTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCreativeTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPendingCreativeTemplateStore(inner: PendingCreativeTemplateStore, ttl: number, clockValue: clock.Clock): PendingCreativeTemplateStore {
  return new CachedPendingCreativeTemplateStore(
    inner,
    cache.newTtlCache<PendingCreativeTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending creative templates. Empty fields match all. */
export class PendingCreativeTemplateQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCreativeTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCreativeTemplate[]): PendingCreativeTemplate[] {
    const matched = collections.filter(items, (candidate: PendingCreativeTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCreativeTemplates(store: PendingCreativeTemplateStore, query: PendingCreativeTemplateQuery): PendingCreativeTemplate[] {
  return query.apply(store.list());
}
