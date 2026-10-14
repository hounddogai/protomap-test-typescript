import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

/** Keeps rolling bid rule audits by code. */
export interface RollingBidRuleAuditStore {
  find(code: string): RollingBidRuleAudit | undefined;
  save(item: RollingBidRuleAudit): void;
  remove(code: string): boolean;
  list(): RollingBidRuleAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBidRuleAuditStore implements RollingBidRuleAuditStore {
  items: Map<string, RollingBidRuleAudit>;
  order: string[];

  constructor(items: Map<string, RollingBidRuleAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBidRuleAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBidRuleAudit): void {
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

  list(): RollingBidRuleAudit[] {
    const out: RollingBidRuleAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBidRuleAuditStore(): RollingBidRuleAuditStore {
  return new MemoryRollingBidRuleAuditStore(new Map<string, RollingBidRuleAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBidRuleAuditStore implements RollingBidRuleAuditStore {
  inner: RollingBidRuleAuditStore;
  cache: cache.TtlCache<RollingBidRuleAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBidRuleAuditStore,
    cacheValue: cache.TtlCache<RollingBidRuleAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBidRuleAudit | undefined {
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

  save(item: RollingBidRuleAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBidRuleAudit[] {
    return this.inner.list();
  }
}

export function newCachedRollingBidRuleAuditStore(inner: RollingBidRuleAuditStore, ttl: number, clockValue: clock.Clock): RollingBidRuleAuditStore {
  return new CachedRollingBidRuleAuditStore(inner, cache.newTtlCache<RollingBidRuleAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling bid rule audits. Empty fields match all. */
export class RollingBidRuleAuditQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBidRuleAudit): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBidRuleAudit[]): RollingBidRuleAudit[] {
    const matched = collections.filter(items, (candidate: RollingBidRuleAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBidRuleAudits(store: RollingBidRuleAuditStore, query: RollingBidRuleAuditQuery): RollingBidRuleAudit[] {
  return query.apply(store.list());
}
