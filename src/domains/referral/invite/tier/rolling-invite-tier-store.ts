import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingInviteTier } from "./rolling-invite-tier.js";

/** Keeps rolling invite tiers by code. */
export interface RollingInviteTierStore {
  find(code: string): RollingInviteTier | undefined;
  save(item: RollingInviteTier): void;
  remove(code: string): boolean;
  list(): RollingInviteTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingInviteTierStore implements RollingInviteTierStore {
  items: Map<string, RollingInviteTier>;
  order: string[];

  constructor(items: Map<string, RollingInviteTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingInviteTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingInviteTier): void {
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

  list(): RollingInviteTier[] {
    const out: RollingInviteTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingInviteTierStore(): RollingInviteTierStore {
  return new MemoryRollingInviteTierStore(new Map<string, RollingInviteTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingInviteTierStore implements RollingInviteTierStore {
  inner: RollingInviteTierStore;
  cache: cache.TtlCache<RollingInviteTier>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingInviteTierStore,
    cacheValue: cache.TtlCache<RollingInviteTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingInviteTier | undefined {
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

  save(item: RollingInviteTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingInviteTier[] {
    return this.inner.list();
  }
}

export function newCachedRollingInviteTierStore(inner: RollingInviteTierStore, ttl: number, clockValue: clock.Clock): RollingInviteTierStore {
  return new CachedRollingInviteTierStore(inner, cache.newTtlCache<RollingInviteTier>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling invite tiers. Empty fields match all. */
export class RollingInviteTierQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingInviteTier): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingInviteTier[]): RollingInviteTier[] {
    const matched = collections.filter(items, (candidate: RollingInviteTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingInviteTiers(store: RollingInviteTierStore, query: RollingInviteTierQuery): RollingInviteTier[] {
  return query.apply(store.list());
}
