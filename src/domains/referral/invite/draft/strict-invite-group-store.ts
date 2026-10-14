import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictInviteGroup } from "./strict-invite-group.js";

/** Keeps strict invite groups by code. */
export interface StrictInviteGroupStore {
  find(code: string): StrictInviteGroup | undefined;
  save(item: StrictInviteGroup): void;
  remove(code: string): boolean;
  list(): StrictInviteGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictInviteGroupStore implements StrictInviteGroupStore {
  items: Map<string, StrictInviteGroup>;
  order: string[];

  constructor(items: Map<string, StrictInviteGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictInviteGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictInviteGroup): void {
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

  list(): StrictInviteGroup[] {
    const out: StrictInviteGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictInviteGroupStore(): StrictInviteGroupStore {
  return new MemoryStrictInviteGroupStore(new Map<string, StrictInviteGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictInviteGroupStore implements StrictInviteGroupStore {
  inner: StrictInviteGroupStore;
  cache: cache.TtlCache<StrictInviteGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictInviteGroupStore,
    cacheValue: cache.TtlCache<StrictInviteGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictInviteGroup | undefined {
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

  save(item: StrictInviteGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictInviteGroup[] {
    return this.inner.list();
  }
}

export function newCachedStrictInviteGroupStore(inner: StrictInviteGroupStore, ttl: number, clockValue: clock.Clock): StrictInviteGroupStore {
  return new CachedStrictInviteGroupStore(inner, cache.newTtlCache<StrictInviteGroup>(256, ttl, clockValue), 0, 0);
}

/** Selects strict invite groups. Empty fields match all. */
export class StrictInviteGroupQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictInviteGroup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictInviteGroup[]): StrictInviteGroup[] {
    const matched = collections.filter(items, (candidate: StrictInviteGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictInviteGroups(store: StrictInviteGroupStore, query: StrictInviteGroupQuery): StrictInviteGroup[] {
  return query.apply(store.list());
}
