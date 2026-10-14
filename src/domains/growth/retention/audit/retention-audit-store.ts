import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionAudit } from "./retention-audit.js";

/** Keeps retention audits by code. */
export interface RetentionAuditStore {
  find(code: string): RetentionAudit | undefined;
  save(item: RetentionAudit): void;
  remove(code: string): boolean;
  list(): RetentionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionAuditStore implements RetentionAuditStore {
  items: Map<string, RetentionAudit>;
  order: string[];

  constructor(items: Map<string, RetentionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionAudit): void {
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

  list(): RetentionAudit[] {
    const out: RetentionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionAuditStore(): RetentionAuditStore {
  return new MemoryRetentionAuditStore(new Map<string, RetentionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionAuditStore implements RetentionAuditStore {
  inner: RetentionAuditStore;
  cache: cache.TtlCache<RetentionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionAuditStore,
    cacheValue: cache.TtlCache<RetentionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionAudit | undefined {
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

  save(item: RetentionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionAudit[] {
    return this.inner.list();
  }
}

export function newCachedRetentionAuditStore(inner: RetentionAuditStore, ttl: number, clockValue: clock.Clock): RetentionAuditStore {
  return new CachedRetentionAuditStore(inner, cache.newTtlCache<RetentionAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects retention audits. Empty fields match all. */
export class RetentionAuditQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionAudit[]): RetentionAudit[] {
    const matched = collections.filter(items, (candidate: RetentionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionAudits(store: RetentionAuditStore, query: RetentionAuditQuery): RetentionAudit[] {
  return query.apply(store.list());
}
