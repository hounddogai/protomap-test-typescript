import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingOptOutTemplate } from "./pending-opt-out-template.js";

/** Keeps pending opt out templates by code. */
export interface PendingOptOutTemplateStore {
  find(code: string): PendingOptOutTemplate | undefined;
  save(item: PendingOptOutTemplate): void;
  remove(code: string): boolean;
  list(): PendingOptOutTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingOptOutTemplateStore implements PendingOptOutTemplateStore {
  items: Map<string, PendingOptOutTemplate>;
  order: string[];

  constructor(items: Map<string, PendingOptOutTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingOptOutTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingOptOutTemplate): void {
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

  list(): PendingOptOutTemplate[] {
    const out: PendingOptOutTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingOptOutTemplateStore(): PendingOptOutTemplateStore {
  return new MemoryPendingOptOutTemplateStore(new Map<string, PendingOptOutTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingOptOutTemplateStore implements PendingOptOutTemplateStore {
  inner: PendingOptOutTemplateStore;
  cache: cache.TtlCache<PendingOptOutTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingOptOutTemplateStore,
    cacheValue: cache.TtlCache<PendingOptOutTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingOptOutTemplate | undefined {
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

  save(item: PendingOptOutTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingOptOutTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPendingOptOutTemplateStore(inner: PendingOptOutTemplateStore, ttl: number, clockValue: clock.Clock): PendingOptOutTemplateStore {
  return new CachedPendingOptOutTemplateStore(
    inner,
    cache.newTtlCache<PendingOptOutTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending opt out templates. Empty fields match all. */
export class PendingOptOutTemplateQuery {
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

  matches(item: PendingOptOutTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingOptOutTemplate[]): PendingOptOutTemplate[] {
    const matched = collections.filter(items, (candidate: PendingOptOutTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingOptOutTemplates(store: PendingOptOutTemplateStore, query: PendingOptOutTemplateQuery): PendingOptOutTemplate[] {
  return query.apply(store.list());
}
