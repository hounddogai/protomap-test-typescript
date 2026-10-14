import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteTarget } from "./invite-target.js";

/** Keeps invite targets by code. */
export interface InviteTargetStore {
  find(code: string): InviteTarget | undefined;
  save(item: InviteTarget): void;
  remove(code: string): boolean;
  list(): InviteTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteTargetStore implements InviteTargetStore {
  items: Map<string, InviteTarget>;
  order: string[];

  constructor(items: Map<string, InviteTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteTarget): void {
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

  list(): InviteTarget[] {
    const out: InviteTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteTargetStore(): InviteTargetStore {
  return new MemoryInviteTargetStore(new Map<string, InviteTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteTargetStore implements InviteTargetStore {
  inner: InviteTargetStore;
  cache: cache.TtlCache<InviteTarget>;
  hits: number;
  misses: number;

  constructor(inner: InviteTargetStore, cacheValue: cache.TtlCache<InviteTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteTarget | undefined {
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

  save(item: InviteTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteTarget[] {
    return this.inner.list();
  }
}

export function newCachedInviteTargetStore(inner: InviteTargetStore, ttl: number, clockValue: clock.Clock): InviteTargetStore {
  return new CachedInviteTargetStore(inner, cache.newTtlCache<InviteTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects invite targets. Empty fields match all. */
export class InviteTargetQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteTarget): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteTarget[]): InviteTarget[] {
    const matched = collections.filter(items, (candidate: InviteTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteTargets(store: InviteTargetStore, query: InviteTargetQuery): InviteTarget[] {
  return query.apply(store.list());
}
