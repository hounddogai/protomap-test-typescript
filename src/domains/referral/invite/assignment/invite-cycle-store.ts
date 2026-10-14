import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteCycle } from "./invite-cycle.js";

/** Keeps invite cycles by code. */
export interface InviteCycleStore {
  find(code: string): InviteCycle | undefined;
  save(item: InviteCycle): void;
  remove(code: string): boolean;
  list(): InviteCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteCycleStore implements InviteCycleStore {
  items: Map<string, InviteCycle>;
  order: string[];

  constructor(items: Map<string, InviteCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteCycle): void {
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

  list(): InviteCycle[] {
    const out: InviteCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteCycleStore(): InviteCycleStore {
  return new MemoryInviteCycleStore(new Map<string, InviteCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteCycleStore implements InviteCycleStore {
  inner: InviteCycleStore;
  cache: cache.TtlCache<InviteCycle>;
  hits: number;
  misses: number;

  constructor(inner: InviteCycleStore, cacheValue: cache.TtlCache<InviteCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteCycle | undefined {
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

  save(item: InviteCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteCycle[] {
    return this.inner.list();
  }
}

export function newCachedInviteCycleStore(inner: InviteCycleStore, ttl: number, clockValue: clock.Clock): InviteCycleStore {
  return new CachedInviteCycleStore(inner, cache.newTtlCache<InviteCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects invite cycles. Empty fields match all. */
export class InviteCycleQuery {
  country: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minOpenRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteCycle[]): InviteCycle[] {
    const matched = collections.filter(items, (candidate: InviteCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteCycles(store: InviteCycleStore, query: InviteCycleQuery): InviteCycle[] {
  return query.apply(store.list());
}
