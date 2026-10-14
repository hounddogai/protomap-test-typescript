import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientConversionAudit } from "./lenient-conversion-audit.js";

/** Keeps lenient conversion audits by code. */
export interface LenientConversionAuditStore {
  find(code: string): LenientConversionAudit | undefined;
  save(item: LenientConversionAudit): void;
  remove(code: string): boolean;
  list(): LenientConversionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientConversionAuditStore implements LenientConversionAuditStore {
  items: Map<string, LenientConversionAudit>;
  order: string[];

  constructor(items: Map<string, LenientConversionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientConversionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientConversionAudit): void {
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

  list(): LenientConversionAudit[] {
    const out: LenientConversionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientConversionAuditStore(): LenientConversionAuditStore {
  return new MemoryLenientConversionAuditStore(new Map<string, LenientConversionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientConversionAuditStore implements LenientConversionAuditStore {
  inner: LenientConversionAuditStore;
  cache: cache.TtlCache<LenientConversionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientConversionAuditStore,
    cacheValue: cache.TtlCache<LenientConversionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientConversionAudit | undefined {
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

  save(item: LenientConversionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientConversionAudit[] {
    return this.inner.list();
  }
}

export function newCachedLenientConversionAuditStore(inner: LenientConversionAuditStore, ttl: number, clockValue: clock.Clock): LenientConversionAuditStore {
  return new CachedLenientConversionAuditStore(
    inner,
    cache.newTtlCache<LenientConversionAudit>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient conversion audits. Empty fields match all. */
export class LenientConversionAuditQuery {
  segment: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minStartsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientConversionAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientConversionAudit[]): LenientConversionAudit[] {
    const matched = collections.filter(items, (candidate: LenientConversionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientConversionAudits(store: LenientConversionAuditStore, query: LenientConversionAuditQuery): LenientConversionAudit[] {
  return query.apply(store.list());
}
