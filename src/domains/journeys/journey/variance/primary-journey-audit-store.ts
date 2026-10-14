import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryJourneyAudit } from "./primary-journey-audit.js";

/** Keeps primary journey audits by code. */
export interface PrimaryJourneyAuditStore {
  find(code: string): PrimaryJourneyAudit | undefined;
  save(item: PrimaryJourneyAudit): void;
  remove(code: string): boolean;
  list(): PrimaryJourneyAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryJourneyAuditStore implements PrimaryJourneyAuditStore {
  items: Map<string, PrimaryJourneyAudit>;
  order: string[];

  constructor(items: Map<string, PrimaryJourneyAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryJourneyAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryJourneyAudit): void {
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

  list(): PrimaryJourneyAudit[] {
    const out: PrimaryJourneyAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryJourneyAuditStore(): PrimaryJourneyAuditStore {
  return new MemoryPrimaryJourneyAuditStore(new Map<string, PrimaryJourneyAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryJourneyAuditStore implements PrimaryJourneyAuditStore {
  inner: PrimaryJourneyAuditStore;
  cache: cache.TtlCache<PrimaryJourneyAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryJourneyAuditStore,
    cacheValue: cache.TtlCache<PrimaryJourneyAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryJourneyAudit | undefined {
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

  save(item: PrimaryJourneyAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryJourneyAudit[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryJourneyAuditStore(inner: PrimaryJourneyAuditStore, ttl: number, clockValue: clock.Clock): PrimaryJourneyAuditStore {
  return new CachedPrimaryJourneyAuditStore(inner, cache.newTtlCache<PrimaryJourneyAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects primary journey audits. Empty fields match all. */
export class PrimaryJourneyAuditQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryJourneyAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryJourneyAudit[]): PrimaryJourneyAudit[] {
    const matched = collections.filter(items, (candidate: PrimaryJourneyAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryJourneyAudits(store: PrimaryJourneyAuditStore, query: PrimaryJourneyAuditQuery): PrimaryJourneyAudit[] {
  return query.apply(store.list());
}
