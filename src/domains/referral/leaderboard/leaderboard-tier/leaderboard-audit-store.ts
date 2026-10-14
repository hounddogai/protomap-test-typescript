import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardAudit } from "./leaderboard-audit.js";

/** Keeps leaderboard audits by code. */
export interface LeaderboardAuditStore {
  find(code: string): LeaderboardAudit | undefined;
  save(item: LeaderboardAudit): void;
  remove(code: string): boolean;
  list(): LeaderboardAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardAuditStore implements LeaderboardAuditStore {
  items: Map<string, LeaderboardAudit>;
  order: string[];

  constructor(items: Map<string, LeaderboardAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardAudit): void {
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

  list(): LeaderboardAudit[] {
    const out: LeaderboardAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardAuditStore(): LeaderboardAuditStore {
  return new MemoryLeaderboardAuditStore(new Map<string, LeaderboardAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardAuditStore implements LeaderboardAuditStore {
  inner: LeaderboardAuditStore;
  cache: cache.TtlCache<LeaderboardAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardAuditStore,
    cacheValue: cache.TtlCache<LeaderboardAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardAudit | undefined {
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

  save(item: LeaderboardAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardAudit[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardAuditStore(inner: LeaderboardAuditStore, ttl: number, clockValue: clock.Clock): LeaderboardAuditStore {
  return new CachedLeaderboardAuditStore(inner, cache.newTtlCache<LeaderboardAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects leaderboard audits. Empty fields match all. */
export class LeaderboardAuditQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardAudit[]): LeaderboardAudit[] {
    const matched = collections.filter(items, (candidate: LeaderboardAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardAudits(store: LeaderboardAuditStore, query: LeaderboardAuditQuery): LeaderboardAudit[] {
  return query.apply(store.list());
}
