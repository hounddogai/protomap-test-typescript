import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPacingAudit } from "./global-pacing-audit.js";

/** Keeps global pacing audits by code. */
export interface GlobalPacingAuditStore {
  find(code: string): GlobalPacingAudit | undefined;
  save(item: GlobalPacingAudit): void;
  remove(code: string): boolean;
  list(): GlobalPacingAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPacingAuditStore implements GlobalPacingAuditStore {
  items: Map<string, GlobalPacingAudit>;
  order: string[];

  constructor(items: Map<string, GlobalPacingAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPacingAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPacingAudit): void {
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

  list(): GlobalPacingAudit[] {
    const out: GlobalPacingAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPacingAuditStore(): GlobalPacingAuditStore {
  return new MemoryGlobalPacingAuditStore(new Map<string, GlobalPacingAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPacingAuditStore implements GlobalPacingAuditStore {
  inner: GlobalPacingAuditStore;
  cache: cache.TtlCache<GlobalPacingAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPacingAuditStore,
    cacheValue: cache.TtlCache<GlobalPacingAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPacingAudit | undefined {
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

  save(item: GlobalPacingAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPacingAudit[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPacingAuditStore(inner: GlobalPacingAuditStore, ttl: number, clockValue: clock.Clock): GlobalPacingAuditStore {
  return new CachedGlobalPacingAuditStore(inner, cache.newTtlCache<GlobalPacingAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects global pacing audits. Empty fields match all. */
export class GlobalPacingAuditQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPacingAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPacingAudit[]): GlobalPacingAudit[] {
    const matched = collections.filter(items, (candidate: GlobalPacingAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPacingAudits(store: GlobalPacingAuditStore, query: GlobalPacingAuditQuery): GlobalPacingAudit[] {
  return query.apply(store.list());
}
