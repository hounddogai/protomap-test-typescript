import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictInvitePolicy } from "./strict-invite-policy.js";

/** Keeps strict invite policies by code. */
export interface StrictInvitePolicyStore {
  find(code: string): StrictInvitePolicy | undefined;
  save(item: StrictInvitePolicy): void;
  remove(code: string): boolean;
  list(): StrictInvitePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictInvitePolicyStore implements StrictInvitePolicyStore {
  items: Map<string, StrictInvitePolicy>;
  order: string[];

  constructor(items: Map<string, StrictInvitePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictInvitePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictInvitePolicy): void {
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

  list(): StrictInvitePolicy[] {
    const out: StrictInvitePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictInvitePolicyStore(): StrictInvitePolicyStore {
  return new MemoryStrictInvitePolicyStore(new Map<string, StrictInvitePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictInvitePolicyStore implements StrictInvitePolicyStore {
  inner: StrictInvitePolicyStore;
  cache: cache.TtlCache<StrictInvitePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictInvitePolicyStore,
    cacheValue: cache.TtlCache<StrictInvitePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictInvitePolicy | undefined {
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

  save(item: StrictInvitePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictInvitePolicy[] {
    return this.inner.list();
  }
}

export function newCachedStrictInvitePolicyStore(inner: StrictInvitePolicyStore, ttl: number, clockValue: clock.Clock): StrictInvitePolicyStore {
  return new CachedStrictInvitePolicyStore(inner, cache.newTtlCache<StrictInvitePolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects strict invite policies. Empty fields match all. */
export class StrictInvitePolicyQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictInvitePolicy): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictInvitePolicy[]): StrictInvitePolicy[] {
    const matched = collections.filter(items, (candidate: StrictInvitePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictInvitePolicies(store: StrictInvitePolicyStore, query: StrictInvitePolicyQuery): StrictInvitePolicy[] {
  return query.apply(store.list());
}
