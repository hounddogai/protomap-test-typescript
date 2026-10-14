import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPlacementAudit } from "./rolling-placement-audit.js";

/** Keeps rolling placement audits by code. */
export interface RollingPlacementAuditStore {
  find(code: string): RollingPlacementAudit | undefined;
  save(item: RollingPlacementAudit): void;
  remove(code: string): boolean;
  list(): RollingPlacementAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPlacementAuditStore implements RollingPlacementAuditStore {
  items: Map<string, RollingPlacementAudit>;
  order: string[];

  constructor(items: Map<string, RollingPlacementAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPlacementAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPlacementAudit): void {
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

  list(): RollingPlacementAudit[] {
    const out: RollingPlacementAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPlacementAuditStore(): RollingPlacementAuditStore {
  return new MemoryRollingPlacementAuditStore(new Map<string, RollingPlacementAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPlacementAuditStore implements RollingPlacementAuditStore {
  inner: RollingPlacementAuditStore;
  cache: cache.TtlCache<RollingPlacementAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPlacementAuditStore,
    cacheValue: cache.TtlCache<RollingPlacementAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPlacementAudit | undefined {
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

  save(item: RollingPlacementAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPlacementAudit[] {
    return this.inner.list();
  }
}

export function newCachedRollingPlacementAuditStore(inner: RollingPlacementAuditStore, ttl: number, clockValue: clock.Clock): RollingPlacementAuditStore {
  return new CachedRollingPlacementAuditStore(
    inner,
    cache.newTtlCache<RollingPlacementAudit>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling placement audits. Empty fields match all. */
export class RollingPlacementAuditQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPlacementAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPlacementAudit[]): RollingPlacementAudit[] {
    const matched = collections.filter(items, (candidate: RollingPlacementAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPlacementAudits(store: RollingPlacementAuditStore, query: RollingPlacementAuditQuery): RollingPlacementAudit[] {
  return query.apply(store.list());
}
