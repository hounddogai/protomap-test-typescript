import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchTemplate } from "./branch-template.js";

/** Keeps branch templates by code. */
export interface BranchTemplateStore {
  find(code: string): BranchTemplate | undefined;
  save(item: BranchTemplate): void;
  remove(code: string): boolean;
  list(): BranchTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchTemplateStore implements BranchTemplateStore {
  items: Map<string, BranchTemplate>;
  order: string[];

  constructor(items: Map<string, BranchTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchTemplate): void {
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

  list(): BranchTemplate[] {
    const out: BranchTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchTemplateStore(): BranchTemplateStore {
  return new MemoryBranchTemplateStore(new Map<string, BranchTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchTemplateStore implements BranchTemplateStore {
  inner: BranchTemplateStore;
  cache: cache.TtlCache<BranchTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchTemplateStore,
    cacheValue: cache.TtlCache<BranchTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchTemplate | undefined {
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

  save(item: BranchTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchTemplate[] {
    return this.inner.list();
  }
}

export function newCachedBranchTemplateStore(inner: BranchTemplateStore, ttl: number, clockValue: clock.Clock): BranchTemplateStore {
  return new CachedBranchTemplateStore(inner, cache.newTtlCache<BranchTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects branch templates. Empty fields match all. */
export class BranchTemplateQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchTemplate[]): BranchTemplate[] {
    const matched = collections.filter(items, (candidate: BranchTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchTemplates(store: BranchTemplateStore, query: BranchTemplateQuery): BranchTemplate[] {
  return query.apply(store.list());
}
