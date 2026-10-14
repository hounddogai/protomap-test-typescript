import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWindowAudit } from "./scheduled-window-audit.js";

/** Keeps scheduled window audits by code. */
export interface ScheduledWindowAuditStore {
  find(code: string): ScheduledWindowAudit | undefined;
  save(item: ScheduledWindowAudit): void;
  remove(code: string): boolean;
  list(): ScheduledWindowAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWindowAuditStore implements ScheduledWindowAuditStore {
  items: Map<string, ScheduledWindowAudit>;
  order: string[];

  constructor(items: Map<string, ScheduledWindowAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWindowAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWindowAudit): void {
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

  list(): ScheduledWindowAudit[] {
    const out: ScheduledWindowAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWindowAuditStore(): ScheduledWindowAuditStore {
  return new MemoryScheduledWindowAuditStore(new Map<string, ScheduledWindowAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWindowAuditStore implements ScheduledWindowAuditStore {
  inner: ScheduledWindowAuditStore;
  cache: cache.TtlCache<ScheduledWindowAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWindowAuditStore,
    cacheValue: cache.TtlCache<ScheduledWindowAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWindowAudit | undefined {
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

  save(item: ScheduledWindowAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWindowAudit[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWindowAuditStore(inner: ScheduledWindowAuditStore, ttl: number, clockValue: clock.Clock): ScheduledWindowAuditStore {
  return new CachedScheduledWindowAuditStore(
    inner,
    cache.newTtlCache<ScheduledWindowAudit>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled window audits. Empty fields match all. */
export class ScheduledWindowAuditQuery {
  source: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minScore: number, statuses: string[], limit: number) {
    this.source = source;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWindowAudit): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWindowAudit[]): ScheduledWindowAudit[] {
    const matched = collections.filter(items, (candidate: ScheduledWindowAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWindowAudits(store: ScheduledWindowAuditStore, query: ScheduledWindowAuditQuery): ScheduledWindowAudit[] {
  return query.apply(store.list());
}
