import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationGroup } from "./reputation-group.js";

/** Keeps reputation groups by code. */
export interface ReputationGroupStore {
  find(code: string): ReputationGroup | undefined;
  save(item: ReputationGroup): void;
  remove(code: string): boolean;
  list(): ReputationGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationGroupStore implements ReputationGroupStore {
  items: Map<string, ReputationGroup>;
  order: string[];

  constructor(items: Map<string, ReputationGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationGroup): void {
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

  list(): ReputationGroup[] {
    const out: ReputationGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationGroupStore(): ReputationGroupStore {
  return new MemoryReputationGroupStore(new Map<string, ReputationGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationGroupStore implements ReputationGroupStore {
  inner: ReputationGroupStore;
  cache: cache.TtlCache<ReputationGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationGroupStore,
    cacheValue: cache.TtlCache<ReputationGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationGroup | undefined {
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

  save(item: ReputationGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationGroup[] {
    return this.inner.list();
  }
}

export function newCachedReputationGroupStore(inner: ReputationGroupStore, ttl: number, clockValue: clock.Clock): ReputationGroupStore {
  return new CachedReputationGroupStore(inner, cache.newTtlCache<ReputationGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects reputation groups. Empty fields match all. */
export class ReputationGroupQuery {
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

  matches(item: ReputationGroup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationGroup[]): ReputationGroup[] {
    const matched = collections.filter(items, (candidate: ReputationGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationGroups(store: ReputationGroupStore, query: ReputationGroupQuery): ReputationGroup[] {
  return query.apply(store.list());
}
