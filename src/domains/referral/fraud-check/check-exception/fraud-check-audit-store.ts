import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckAudit } from "./fraud-check-audit.js";

/** Keeps fraud check audits by code. */
export interface FraudCheckAuditStore {
  find(code: string): FraudCheckAudit | undefined;
  save(item: FraudCheckAudit): void;
  remove(code: string): boolean;
  list(): FraudCheckAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckAuditStore implements FraudCheckAuditStore {
  items: Map<string, FraudCheckAudit>;
  order: string[];

  constructor(items: Map<string, FraudCheckAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckAudit): void {
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

  list(): FraudCheckAudit[] {
    const out: FraudCheckAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckAuditStore(): FraudCheckAuditStore {
  return new MemoryFraudCheckAuditStore(new Map<string, FraudCheckAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckAuditStore implements FraudCheckAuditStore {
  inner: FraudCheckAuditStore;
  cache: cache.TtlCache<FraudCheckAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckAuditStore,
    cacheValue: cache.TtlCache<FraudCheckAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckAudit | undefined {
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

  save(item: FraudCheckAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckAudit[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckAuditStore(inner: FraudCheckAuditStore, ttl: number, clockValue: clock.Clock): FraudCheckAuditStore {
  return new CachedFraudCheckAuditStore(inner, cache.newTtlCache<FraudCheckAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check audits. Empty fields match all. */
export class FraudCheckAuditQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckAudit[]): FraudCheckAudit[] {
    const matched = collections.filter(items, (candidate: FraudCheckAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckAudits(store: FraudCheckAuditStore, query: FraudCheckAuditQuery): FraudCheckAudit[] {
  return query.apply(store.list());
}
