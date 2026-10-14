import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingAudit } from "./pacing-audit.js";

/** Keeps pacing audits by code. */
export interface PacingAuditStore {
  find(code: string): PacingAudit | undefined;
  save(item: PacingAudit): void;
  remove(code: string): boolean;
  list(): PacingAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingAuditStore implements PacingAuditStore {
  items: Map<string, PacingAudit>;
  order: string[];

  constructor(items: Map<string, PacingAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingAudit): void {
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

  list(): PacingAudit[] {
    const out: PacingAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingAuditStore(): PacingAuditStore {
  return new MemoryPacingAuditStore(new Map<string, PacingAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingAuditStore implements PacingAuditStore {
  inner: PacingAuditStore;
  cache: cache.TtlCache<PacingAudit>;
  hits: number;
  misses: number;

  constructor(inner: PacingAuditStore, cacheValue: cache.TtlCache<PacingAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingAudit | undefined {
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

  save(item: PacingAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingAudit[] {
    return this.inner.list();
  }
}

export function newCachedPacingAuditStore(inner: PacingAuditStore, ttl: number, clockValue: clock.Clock): PacingAuditStore {
  return new CachedPacingAuditStore(inner, cache.newTtlCache<PacingAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing audits. Empty fields match all. */
export class PacingAuditQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingAudit[]): PacingAudit[] {
    const matched = collections.filter(items, (candidate: PacingAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingAudits(store: PacingAuditStore, query: PacingAuditQuery): PacingAudit[] {
  return query.apply(store.list());
}
