import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalInsightGroup } from "./regional-insight-group.js";

/** Keeps regional insight groups by code. */
export interface RegionalInsightGroupStore {
  find(code: string): RegionalInsightGroup | undefined;
  save(item: RegionalInsightGroup): void;
  remove(code: string): boolean;
  list(): RegionalInsightGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalInsightGroupStore implements RegionalInsightGroupStore {
  items: Map<string, RegionalInsightGroup>;
  order: string[];

  constructor(items: Map<string, RegionalInsightGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalInsightGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalInsightGroup): void {
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

  list(): RegionalInsightGroup[] {
    const out: RegionalInsightGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalInsightGroupStore(): RegionalInsightGroupStore {
  return new MemoryRegionalInsightGroupStore(new Map<string, RegionalInsightGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalInsightGroupStore implements RegionalInsightGroupStore {
  inner: RegionalInsightGroupStore;
  cache: cache.TtlCache<RegionalInsightGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalInsightGroupStore,
    cacheValue: cache.TtlCache<RegionalInsightGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalInsightGroup | undefined {
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

  save(item: RegionalInsightGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalInsightGroup[] {
    return this.inner.list();
  }
}

export function newCachedRegionalInsightGroupStore(inner: RegionalInsightGroupStore, ttl: number, clockValue: clock.Clock): RegionalInsightGroupStore {
  return new CachedRegionalInsightGroupStore(
    inner,
    cache.newTtlCache<RegionalInsightGroup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional insight groups. Empty fields match all. */
export class RegionalInsightGroupQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalInsightGroup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalInsightGroup[]): RegionalInsightGroup[] {
    const matched = collections.filter(items, (candidate: RegionalInsightGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalInsightGroups(store: RegionalInsightGroupStore, query: RegionalInsightGroupQuery): RegionalInsightGroup[] {
  return query.apply(store.list());
}
