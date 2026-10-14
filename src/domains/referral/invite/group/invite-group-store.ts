import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteGroup } from "./invite-group.js";

/** Keeps invite groups by code. */
export interface InviteGroupStore {
  find(code: string): InviteGroup | undefined;
  save(item: InviteGroup): void;
  remove(code: string): boolean;
  list(): InviteGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteGroupStore implements InviteGroupStore {
  items: Map<string, InviteGroup>;
  order: string[];

  constructor(items: Map<string, InviteGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteGroup): void {
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

  list(): InviteGroup[] {
    const out: InviteGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteGroupStore(): InviteGroupStore {
  return new MemoryInviteGroupStore(new Map<string, InviteGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteGroupStore implements InviteGroupStore {
  inner: InviteGroupStore;
  cache: cache.TtlCache<InviteGroup>;
  hits: number;
  misses: number;

  constructor(inner: InviteGroupStore, cacheValue: cache.TtlCache<InviteGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteGroup | undefined {
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

  save(item: InviteGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteGroup[] {
    return this.inner.list();
  }
}

export function newCachedInviteGroupStore(inner: InviteGroupStore, ttl: number, clockValue: clock.Clock): InviteGroupStore {
  return new CachedInviteGroupStore(inner, cache.newTtlCache<InviteGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects invite groups. Empty fields match all. */
export class InviteGroupQuery {
  utmSource: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteGroup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteGroup[]): InviteGroup[] {
    const matched = collections.filter(items, (candidate: InviteGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteGroups(store: InviteGroupStore, query: InviteGroupQuery): InviteGroup[] {
  return query.apply(store.list());
}
