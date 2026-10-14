import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationAudit } from "./reputation-audit.js";

/** Keeps reputation audits by code. */
export interface ReputationAuditStore {
  find(code: string): ReputationAudit | undefined;
  save(item: ReputationAudit): void;
  remove(code: string): boolean;
  list(): ReputationAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationAuditStore implements ReputationAuditStore {
  items: Map<string, ReputationAudit>;
  order: string[];

  constructor(items: Map<string, ReputationAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationAudit): void {
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

  list(): ReputationAudit[] {
    const out: ReputationAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationAuditStore(): ReputationAuditStore {
  return new MemoryReputationAuditStore(new Map<string, ReputationAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationAuditStore implements ReputationAuditStore {
  inner: ReputationAuditStore;
  cache: cache.TtlCache<ReputationAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationAuditStore,
    cacheValue: cache.TtlCache<ReputationAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationAudit | undefined {
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

  save(item: ReputationAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationAudit[] {
    return this.inner.list();
  }
}

export function newCachedReputationAuditStore(inner: ReputationAuditStore, ttl: number, clockValue: clock.Clock): ReputationAuditStore {
  return new CachedReputationAuditStore(inner, cache.newTtlCache<ReputationAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects reputation audits. Empty fields match all. */
export class ReputationAuditQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationAudit[]): ReputationAudit[] {
    const matched = collections.filter(items, (candidate: ReputationAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationAudits(store: ReputationAuditStore, query: ReputationAuditQuery): ReputationAudit[] {
  return query.apply(store.list());
}
