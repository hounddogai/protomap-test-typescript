import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteAudit } from "./invite-audit.js";

/** Keeps invite audits by code. */
export interface InviteAuditStore {
  find(code: string): InviteAudit | undefined;
  save(item: InviteAudit): void;
  remove(code: string): boolean;
  list(): InviteAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteAuditStore implements InviteAuditStore {
  items: Map<string, InviteAudit>;
  order: string[];

  constructor(items: Map<string, InviteAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteAudit): void {
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

  list(): InviteAudit[] {
    const out: InviteAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteAuditStore(): InviteAuditStore {
  return new MemoryInviteAuditStore(new Map<string, InviteAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteAuditStore implements InviteAuditStore {
  inner: InviteAuditStore;
  cache: cache.TtlCache<InviteAudit>;
  hits: number;
  misses: number;

  constructor(inner: InviteAuditStore, cacheValue: cache.TtlCache<InviteAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteAudit | undefined {
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

  save(item: InviteAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteAudit[] {
    return this.inner.list();
  }
}

export function newCachedInviteAuditStore(inner: InviteAuditStore, ttl: number, clockValue: clock.Clock): InviteAuditStore {
  return new CachedInviteAuditStore(inner, cache.newTtlCache<InviteAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects invite audits. Empty fields match all. */
export class InviteAuditQuery {
  segment: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFloorValue: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteAudit[]): InviteAudit[] {
    const matched = collections.filter(items, (candidate: InviteAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteAudits(store: InviteAuditStore, query: InviteAuditQuery): InviteAudit[] {
  return query.apply(store.list());
}
