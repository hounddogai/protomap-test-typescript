import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

/** Keeps rolling leaderboard audits by code. */
export interface RollingLeaderboardAuditStore {
  find(code: string): RollingLeaderboardAudit | undefined;
  save(item: RollingLeaderboardAudit): void;
  remove(code: string): boolean;
  list(): RollingLeaderboardAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingLeaderboardAuditStore implements RollingLeaderboardAuditStore {
  items: Map<string, RollingLeaderboardAudit>;
  order: string[];

  constructor(items: Map<string, RollingLeaderboardAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingLeaderboardAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingLeaderboardAudit): void {
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

  list(): RollingLeaderboardAudit[] {
    const out: RollingLeaderboardAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingLeaderboardAuditStore(): RollingLeaderboardAuditStore {
  return new MemoryRollingLeaderboardAuditStore(new Map<string, RollingLeaderboardAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingLeaderboardAuditStore implements RollingLeaderboardAuditStore {
  inner: RollingLeaderboardAuditStore;
  cache: cache.TtlCache<RollingLeaderboardAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingLeaderboardAuditStore,
    cacheValue: cache.TtlCache<RollingLeaderboardAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingLeaderboardAudit | undefined {
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

  save(item: RollingLeaderboardAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingLeaderboardAudit[] {
    return this.inner.list();
  }
}

export function newCachedRollingLeaderboardAuditStore(inner: RollingLeaderboardAuditStore, ttl: number, clockValue: clock.Clock): RollingLeaderboardAuditStore {
  return new CachedRollingLeaderboardAuditStore(
    inner,
    cache.newTtlCache<RollingLeaderboardAudit>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling leaderboard audits. Empty fields match all. */
export class RollingLeaderboardAuditQuery {
  category: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAmount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingLeaderboardAudit): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingLeaderboardAudit[]): RollingLeaderboardAudit[] {
    const matched = collections.filter(items, (candidate: RollingLeaderboardAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingLeaderboardAudits(store: RollingLeaderboardAuditStore, query: RollingLeaderboardAuditQuery): RollingLeaderboardAudit[] {
  return query.apply(store.list());
}
