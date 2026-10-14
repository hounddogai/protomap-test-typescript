import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteRollup } from "./invite-rollup.js";

/** Keeps invite rollups by code. */
export interface InviteRollupStore {
  find(code: string): InviteRollup | undefined;
  save(item: InviteRollup): void;
  remove(code: string): boolean;
  list(): InviteRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteRollupStore implements InviteRollupStore {
  items: Map<string, InviteRollup>;
  order: string[];

  constructor(items: Map<string, InviteRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteRollup): void {
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

  list(): InviteRollup[] {
    const out: InviteRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteRollupStore(): InviteRollupStore {
  return new MemoryInviteRollupStore(new Map<string, InviteRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteRollupStore implements InviteRollupStore {
  inner: InviteRollupStore;
  cache: cache.TtlCache<InviteRollup>;
  hits: number;
  misses: number;

  constructor(inner: InviteRollupStore, cacheValue: cache.TtlCache<InviteRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteRollup | undefined {
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

  save(item: InviteRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteRollup[] {
    return this.inner.list();
  }
}

export function newCachedInviteRollupStore(inner: InviteRollupStore, ttl: number, clockValue: clock.Clock): InviteRollupStore {
  return new CachedInviteRollupStore(inner, cache.newTtlCache<InviteRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects invite rollups. Empty fields match all. */
export class InviteRollupQuery {
  segment: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minGraceDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteRollup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteRollup[]): InviteRollup[] {
    const matched = collections.filter(items, (candidate: InviteRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteRollups(store: InviteRollupStore, query: InviteRollupQuery): InviteRollup[] {
  return query.apply(store.list());
}
