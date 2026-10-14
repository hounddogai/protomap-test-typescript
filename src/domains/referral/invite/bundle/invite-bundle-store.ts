import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteBundle } from "./invite-bundle.js";

/** Keeps invite bundles by code. */
export interface InviteBundleStore {
  find(code: string): InviteBundle | undefined;
  save(item: InviteBundle): void;
  remove(code: string): boolean;
  list(): InviteBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteBundleStore implements InviteBundleStore {
  items: Map<string, InviteBundle>;
  order: string[];

  constructor(items: Map<string, InviteBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteBundle): void {
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

  list(): InviteBundle[] {
    const out: InviteBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteBundleStore(): InviteBundleStore {
  return new MemoryInviteBundleStore(new Map<string, InviteBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteBundleStore implements InviteBundleStore {
  inner: InviteBundleStore;
  cache: cache.TtlCache<InviteBundle>;
  hits: number;
  misses: number;

  constructor(inner: InviteBundleStore, cacheValue: cache.TtlCache<InviteBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteBundle | undefined {
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

  save(item: InviteBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteBundle[] {
    return this.inner.list();
  }
}

export function newCachedInviteBundleStore(inner: InviteBundleStore, ttl: number, clockValue: clock.Clock): InviteBundleStore {
  return new CachedInviteBundleStore(inner, cache.newTtlCache<InviteBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects invite bundles. Empty fields match all. */
export class InviteBundleQuery {
  unit: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMargin: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteBundle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteBundle[]): InviteBundle[] {
    const matched = collections.filter(items, (candidate: InviteBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteBundles(store: InviteBundleStore, query: InviteBundleQuery): InviteBundle[] {
  return query.apply(store.list());
}
