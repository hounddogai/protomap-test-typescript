import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionAudit } from "./suppression-audit.js";

/** Keeps suppression audits by code. */
export interface SuppressionAuditStore {
  find(code: string): SuppressionAudit | undefined;
  save(item: SuppressionAudit): void;
  remove(code: string): boolean;
  list(): SuppressionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionAuditStore implements SuppressionAuditStore {
  items: Map<string, SuppressionAudit>;
  order: string[];

  constructor(items: Map<string, SuppressionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionAudit): void {
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

  list(): SuppressionAudit[] {
    const out: SuppressionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionAuditStore(): SuppressionAuditStore {
  return new MemorySuppressionAuditStore(new Map<string, SuppressionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionAuditStore implements SuppressionAuditStore {
  inner: SuppressionAuditStore;
  cache: cache.TtlCache<SuppressionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionAuditStore,
    cacheValue: cache.TtlCache<SuppressionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionAudit | undefined {
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

  save(item: SuppressionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionAudit[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionAuditStore(inner: SuppressionAuditStore, ttl: number, clockValue: clock.Clock): SuppressionAuditStore {
  return new CachedSuppressionAuditStore(inner, cache.newTtlCache<SuppressionAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects suppression audits. Empty fields match all. */
export class SuppressionAuditQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionAudit[]): SuppressionAudit[] {
    const matched = collections.filter(items, (candidate: SuppressionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionAudits(store: SuppressionAuditStore, query: SuppressionAuditQuery): SuppressionAudit[] {
  return query.apply(store.list());
}
