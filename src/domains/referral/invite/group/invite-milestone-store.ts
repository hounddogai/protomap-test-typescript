import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteMilestone } from "./invite-milestone.js";

/** Keeps invite milestones by code. */
export interface InviteMilestoneStore {
  find(code: string): InviteMilestone | undefined;
  save(item: InviteMilestone): void;
  remove(code: string): boolean;
  list(): InviteMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteMilestoneStore implements InviteMilestoneStore {
  items: Map<string, InviteMilestone>;
  order: string[];

  constructor(items: Map<string, InviteMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteMilestone): void {
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

  list(): InviteMilestone[] {
    const out: InviteMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteMilestoneStore(): InviteMilestoneStore {
  return new MemoryInviteMilestoneStore(new Map<string, InviteMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteMilestoneStore implements InviteMilestoneStore {
  inner: InviteMilestoneStore;
  cache: cache.TtlCache<InviteMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteMilestoneStore,
    cacheValue: cache.TtlCache<InviteMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteMilestone | undefined {
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

  save(item: InviteMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteMilestone[] {
    return this.inner.list();
  }
}

export function newCachedInviteMilestoneStore(inner: InviteMilestoneStore, ttl: number, clockValue: clock.Clock): InviteMilestoneStore {
  return new CachedInviteMilestoneStore(inner, cache.newTtlCache<InviteMilestone>(64, ttl, clockValue), 0, 0);
}

/** Selects invite milestones. Empty fields match all. */
export class InviteMilestoneQuery {
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

  matches(item: InviteMilestone): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteMilestone[]): InviteMilestone[] {
    const matched = collections.filter(items, (candidate: InviteMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteMilestones(store: InviteMilestoneStore, query: InviteMilestoneQuery): InviteMilestone[] {
  return query.apply(store.list());
}
