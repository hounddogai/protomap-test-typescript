import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingProofAudit } from "./pending-proof-audit.js";

/** Keeps pending proof audits by code. */
export interface PendingProofAuditStore {
  find(code: string): PendingProofAudit | undefined;
  save(item: PendingProofAudit): void;
  remove(code: string): boolean;
  list(): PendingProofAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingProofAuditStore implements PendingProofAuditStore {
  items: Map<string, PendingProofAudit>;
  order: string[];

  constructor(items: Map<string, PendingProofAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingProofAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingProofAudit): void {
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

  list(): PendingProofAudit[] {
    const out: PendingProofAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingProofAuditStore(): PendingProofAuditStore {
  return new MemoryPendingProofAuditStore(new Map<string, PendingProofAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingProofAuditStore implements PendingProofAuditStore {
  inner: PendingProofAuditStore;
  cache: cache.TtlCache<PendingProofAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingProofAuditStore,
    cacheValue: cache.TtlCache<PendingProofAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingProofAudit | undefined {
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

  save(item: PendingProofAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingProofAudit[] {
    return this.inner.list();
  }
}

export function newCachedPendingProofAuditStore(inner: PendingProofAuditStore, ttl: number, clockValue: clock.Clock): PendingProofAuditStore {
  return new CachedPendingProofAuditStore(inner, cache.newTtlCache<PendingProofAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects pending proof audits. Empty fields match all. */
export class PendingProofAuditQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingProofAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingProofAudit[]): PendingProofAudit[] {
    const matched = collections.filter(items, (candidate: PendingProofAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingProofAudits(store: PendingProofAuditStore, query: PendingProofAuditQuery): PendingProofAudit[] {
  return query.apply(store.list());
}
