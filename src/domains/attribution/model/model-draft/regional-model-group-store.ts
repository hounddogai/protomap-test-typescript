import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalModelGroup } from "./regional-model-group.js";

/** Keeps regional model groups by code. */
export interface RegionalModelGroupStore {
  find(code: string): RegionalModelGroup | undefined;
  save(item: RegionalModelGroup): void;
  remove(code: string): boolean;
  list(): RegionalModelGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalModelGroupStore implements RegionalModelGroupStore {
  items: Map<string, RegionalModelGroup>;
  order: string[];

  constructor(items: Map<string, RegionalModelGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalModelGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalModelGroup): void {
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

  list(): RegionalModelGroup[] {
    const out: RegionalModelGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalModelGroupStore(): RegionalModelGroupStore {
  return new MemoryRegionalModelGroupStore(new Map<string, RegionalModelGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalModelGroupStore implements RegionalModelGroupStore {
  inner: RegionalModelGroupStore;
  cache: cache.TtlCache<RegionalModelGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalModelGroupStore,
    cacheValue: cache.TtlCache<RegionalModelGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalModelGroup | undefined {
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

  save(item: RegionalModelGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalModelGroup[] {
    return this.inner.list();
  }
}

export function newCachedRegionalModelGroupStore(inner: RegionalModelGroupStore, ttl: number, clockValue: clock.Clock): RegionalModelGroupStore {
  return new CachedRegionalModelGroupStore(inner, cache.newTtlCache<RegionalModelGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects regional model groups. Empty fields match all. */
export class RegionalModelGroupQuery {
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

  matches(item: RegionalModelGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalModelGroup[]): RegionalModelGroup[] {
    const matched = collections.filter(items, (candidate: RegionalModelGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalModelGroups(store: RegionalModelGroupStore, query: RegionalModelGroupQuery): RegionalModelGroup[] {
  return query.apply(store.list());
}
