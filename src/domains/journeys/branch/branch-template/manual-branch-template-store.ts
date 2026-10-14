import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBranchTemplate } from "./manual-branch-template.js";

/** Keeps manual branch templates by code. */
export interface ManualBranchTemplateStore {
  find(code: string): ManualBranchTemplate | undefined;
  save(item: ManualBranchTemplate): void;
  remove(code: string): boolean;
  list(): ManualBranchTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBranchTemplateStore implements ManualBranchTemplateStore {
  items: Map<string, ManualBranchTemplate>;
  order: string[];

  constructor(items: Map<string, ManualBranchTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBranchTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBranchTemplate): void {
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

  list(): ManualBranchTemplate[] {
    const out: ManualBranchTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBranchTemplateStore(): ManualBranchTemplateStore {
  return new MemoryManualBranchTemplateStore(new Map<string, ManualBranchTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBranchTemplateStore implements ManualBranchTemplateStore {
  inner: ManualBranchTemplateStore;
  cache: cache.TtlCache<ManualBranchTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBranchTemplateStore,
    cacheValue: cache.TtlCache<ManualBranchTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBranchTemplate | undefined {
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

  save(item: ManualBranchTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBranchTemplate[] {
    return this.inner.list();
  }
}

export function newCachedManualBranchTemplateStore(inner: ManualBranchTemplateStore, ttl: number, clockValue: clock.Clock): ManualBranchTemplateStore {
  return new CachedManualBranchTemplateStore(
    inner,
    cache.newTtlCache<ManualBranchTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual branch templates. Empty fields match all. */
export class ManualBranchTemplateQuery {
  source: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBid: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBranchTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBranchTemplate[]): ManualBranchTemplate[] {
    const matched = collections.filter(items, (candidate: ManualBranchTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBranchTemplates(store: ManualBranchTemplateStore, query: ManualBranchTemplateQuery): ManualBranchTemplate[] {
  return query.apply(store.list());
}
