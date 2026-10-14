import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InvitePolicy } from "./invite-policy.js";

/** Keeps invite policies by code. */
export interface InvitePolicyStore {
  find(code: string): InvitePolicy | undefined;
  save(item: InvitePolicy): void;
  remove(code: string): boolean;
  list(): InvitePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInvitePolicyStore implements InvitePolicyStore {
  items: Map<string, InvitePolicy>;
  order: string[];

  constructor(items: Map<string, InvitePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InvitePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InvitePolicy): void {
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

  list(): InvitePolicy[] {
    const out: InvitePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInvitePolicyStore(): InvitePolicyStore {
  return new MemoryInvitePolicyStore(new Map<string, InvitePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInvitePolicyStore implements InvitePolicyStore {
  inner: InvitePolicyStore;
  cache: cache.TtlCache<InvitePolicy>;
  hits: number;
  misses: number;

  constructor(inner: InvitePolicyStore, cacheValue: cache.TtlCache<InvitePolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InvitePolicy | undefined {
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

  save(item: InvitePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InvitePolicy[] {
    return this.inner.list();
  }
}

export function newCachedInvitePolicyStore(inner: InvitePolicyStore, ttl: number, clockValue: clock.Clock): InvitePolicyStore {
  return new CachedInvitePolicyStore(inner, cache.newTtlCache<InvitePolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects invite policies. Empty fields match all. */
export class InvitePolicyQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InvitePolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InvitePolicy[]): InvitePolicy[] {
    const matched = collections.filter(items, (candidate: InvitePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInvitePolicies(store: InvitePolicyStore, query: InvitePolicyQuery): InvitePolicy[] {
  return query.apply(store.list());
}
