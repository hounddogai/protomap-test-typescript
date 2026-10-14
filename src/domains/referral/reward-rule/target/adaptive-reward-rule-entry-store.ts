import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleEntry } from "./adaptive-reward-rule-entry.js";

/** Keeps adaptive reward rule entries by code. */
export interface AdaptiveRewardRuleEntryStore {
  find(code: string): AdaptiveRewardRuleEntry | undefined;
  save(item: AdaptiveRewardRuleEntry): void;
  remove(code: string): boolean;
  list(): AdaptiveRewardRuleEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveRewardRuleEntryStore implements AdaptiveRewardRuleEntryStore {
  items: Map<string, AdaptiveRewardRuleEntry>;
  order: string[];

  constructor(items: Map<string, AdaptiveRewardRuleEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveRewardRuleEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveRewardRuleEntry): void {
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

  list(): AdaptiveRewardRuleEntry[] {
    const out: AdaptiveRewardRuleEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveRewardRuleEntryStore(): AdaptiveRewardRuleEntryStore {
  return new MemoryAdaptiveRewardRuleEntryStore(new Map<string, AdaptiveRewardRuleEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveRewardRuleEntryStore implements AdaptiveRewardRuleEntryStore {
  inner: AdaptiveRewardRuleEntryStore;
  cache: cache.TtlCache<AdaptiveRewardRuleEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveRewardRuleEntryStore,
    cacheValue: cache.TtlCache<AdaptiveRewardRuleEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveRewardRuleEntry | undefined {
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

  save(item: AdaptiveRewardRuleEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveRewardRuleEntry[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveRewardRuleEntryStore(inner: AdaptiveRewardRuleEntryStore, ttl: number, clockValue: clock.Clock): AdaptiveRewardRuleEntryStore {
  return new CachedAdaptiveRewardRuleEntryStore(
    inner,
    cache.newTtlCache<AdaptiveRewardRuleEntry>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive reward rule entries. Empty fields match all. */
export class AdaptiveRewardRuleEntryQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveRewardRuleEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveRewardRuleEntry[]): AdaptiveRewardRuleEntry[] {
    const matched = collections.filter(items, (candidate: AdaptiveRewardRuleEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveRewardRuleEntries(store: AdaptiveRewardRuleEntryStore, query: AdaptiveRewardRuleEntryQuery): AdaptiveRewardRuleEntry[] {
  return query.apply(store.list());
}
