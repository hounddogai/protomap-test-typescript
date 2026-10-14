import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSenderGroup } from "./global-sender-group.js";

/** Keeps global sender groups by code. */
export interface GlobalSenderGroupStore {
  find(code: string): GlobalSenderGroup | undefined;
  save(item: GlobalSenderGroup): void;
  remove(code: string): boolean;
  list(): GlobalSenderGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSenderGroupStore implements GlobalSenderGroupStore {
  items: Map<string, GlobalSenderGroup>;
  order: string[];

  constructor(items: Map<string, GlobalSenderGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSenderGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSenderGroup): void {
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

  list(): GlobalSenderGroup[] {
    const out: GlobalSenderGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSenderGroupStore(): GlobalSenderGroupStore {
  return new MemoryGlobalSenderGroupStore(new Map<string, GlobalSenderGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSenderGroupStore implements GlobalSenderGroupStore {
  inner: GlobalSenderGroupStore;
  cache: cache.TtlCache<GlobalSenderGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSenderGroupStore,
    cacheValue: cache.TtlCache<GlobalSenderGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSenderGroup | undefined {
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

  save(item: GlobalSenderGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSenderGroup[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSenderGroupStore(inner: GlobalSenderGroupStore, ttl: number, clockValue: clock.Clock): GlobalSenderGroupStore {
  return new CachedGlobalSenderGroupStore(inner, cache.newTtlCache<GlobalSenderGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects global sender groups. Empty fields match all. */
export class GlobalSenderGroupQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSenderGroup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSenderGroup[]): GlobalSenderGroup[] {
    const matched = collections.filter(items, (candidate: GlobalSenderGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSenderGroups(store: GlobalSenderGroupStore, query: GlobalSenderGroupQuery): GlobalSenderGroup[] {
  return query.apply(store.list());
}
