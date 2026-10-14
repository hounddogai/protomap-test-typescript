import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteMapping } from "./invite-mapping.js";

/** Keeps invite mappings by code. */
export interface InviteMappingStore {
  find(code: string): InviteMapping | undefined;
  save(item: InviteMapping): void;
  remove(code: string): boolean;
  list(): InviteMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteMappingStore implements InviteMappingStore {
  items: Map<string, InviteMapping>;
  order: string[];

  constructor(items: Map<string, InviteMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteMapping): void {
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

  list(): InviteMapping[] {
    const out: InviteMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteMappingStore(): InviteMappingStore {
  return new MemoryInviteMappingStore(new Map<string, InviteMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteMappingStore implements InviteMappingStore {
  inner: InviteMappingStore;
  cache: cache.TtlCache<InviteMapping>;
  hits: number;
  misses: number;

  constructor(inner: InviteMappingStore, cacheValue: cache.TtlCache<InviteMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteMapping | undefined {
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

  save(item: InviteMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteMapping[] {
    return this.inner.list();
  }
}

export function newCachedInviteMappingStore(inner: InviteMappingStore, ttl: number, clockValue: clock.Clock): InviteMappingStore {
  return new CachedInviteMappingStore(inner, cache.newTtlCache<InviteMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects invite mappings. Empty fields match all. */
export class InviteMappingQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteMapping[]): InviteMapping[] {
    const matched = collections.filter(items, (candidate: InviteMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteMappings(store: InviteMappingStore, query: InviteMappingQuery): InviteMapping[] {
  return query.apply(store.list());
}
