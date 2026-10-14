import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchAudit } from "./branch-audit.js";

/** Keeps branch audits by code. */
export interface BranchAuditStore {
  find(code: string): BranchAudit | undefined;
  save(item: BranchAudit): void;
  remove(code: string): boolean;
  list(): BranchAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchAuditStore implements BranchAuditStore {
  items: Map<string, BranchAudit>;
  order: string[];

  constructor(items: Map<string, BranchAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchAudit): void {
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

  list(): BranchAudit[] {
    const out: BranchAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchAuditStore(): BranchAuditStore {
  return new MemoryBranchAuditStore(new Map<string, BranchAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchAuditStore implements BranchAuditStore {
  inner: BranchAuditStore;
  cache: cache.TtlCache<BranchAudit>;
  hits: number;
  misses: number;

  constructor(inner: BranchAuditStore, cacheValue: cache.TtlCache<BranchAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchAudit | undefined {
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

  save(item: BranchAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchAudit[] {
    return this.inner.list();
  }
}

export function newCachedBranchAuditStore(inner: BranchAuditStore, ttl: number, clockValue: clock.Clock): BranchAuditStore {
  return new CachedBranchAuditStore(inner, cache.newTtlCache<BranchAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects branch audits. Empty fields match all. */
export class BranchAuditQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchAudit[]): BranchAudit[] {
    const matched = collections.filter(items, (candidate: BranchAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchAudits(store: BranchAuditStore, query: BranchAuditQuery): BranchAudit[] {
  return query.apply(store.list());
}
