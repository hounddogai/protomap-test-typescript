import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBranchGroup } from "./rolling-branch-group.js";

/** Keeps rolling branch groups by code. */
export interface RollingBranchGroupStore {
  find(code: string): RollingBranchGroup | undefined;
  save(item: RollingBranchGroup): void;
  remove(code: string): boolean;
  list(): RollingBranchGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBranchGroupStore implements RollingBranchGroupStore {
  items: Map<string, RollingBranchGroup>;
  order: string[];

  constructor(items: Map<string, RollingBranchGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBranchGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBranchGroup): void {
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

  list(): RollingBranchGroup[] {
    const out: RollingBranchGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBranchGroupStore(): RollingBranchGroupStore {
  return new MemoryRollingBranchGroupStore(new Map<string, RollingBranchGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBranchGroupStore implements RollingBranchGroupStore {
  inner: RollingBranchGroupStore;
  cache: cache.TtlCache<RollingBranchGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBranchGroupStore,
    cacheValue: cache.TtlCache<RollingBranchGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBranchGroup | undefined {
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

  save(item: RollingBranchGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBranchGroup[] {
    return this.inner.list();
  }
}

export function newCachedRollingBranchGroupStore(inner: RollingBranchGroupStore, ttl: number, clockValue: clock.Clock): RollingBranchGroupStore {
  return new CachedRollingBranchGroupStore(inner, cache.newTtlCache<RollingBranchGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects rolling branch groups. Empty fields match all. */
export class RollingBranchGroupQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBranchGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBranchGroup[]): RollingBranchGroup[] {
    const matched = collections.filter(items, (candidate: RollingBranchGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBranchGroups(store: RollingBranchGroupStore, query: RollingBranchGroupQuery): RollingBranchGroup[] {
  return query.apply(store.list());
}
