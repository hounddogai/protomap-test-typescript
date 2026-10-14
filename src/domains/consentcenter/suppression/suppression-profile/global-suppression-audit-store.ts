import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSuppressionAudit } from "./global-suppression-audit.js";

/** Keeps global suppression audits by code. */
export interface GlobalSuppressionAuditStore {
  find(code: string): GlobalSuppressionAudit | undefined;
  save(item: GlobalSuppressionAudit): void;
  remove(code: string): boolean;
  list(): GlobalSuppressionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSuppressionAuditStore implements GlobalSuppressionAuditStore {
  items: Map<string, GlobalSuppressionAudit>;
  order: string[];

  constructor(items: Map<string, GlobalSuppressionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSuppressionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSuppressionAudit): void {
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

  list(): GlobalSuppressionAudit[] {
    const out: GlobalSuppressionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSuppressionAuditStore(): GlobalSuppressionAuditStore {
  return new MemoryGlobalSuppressionAuditStore(new Map<string, GlobalSuppressionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSuppressionAuditStore implements GlobalSuppressionAuditStore {
  inner: GlobalSuppressionAuditStore;
  cache: cache.TtlCache<GlobalSuppressionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSuppressionAuditStore,
    cacheValue: cache.TtlCache<GlobalSuppressionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSuppressionAudit | undefined {
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

  save(item: GlobalSuppressionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSuppressionAudit[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSuppressionAuditStore(inner: GlobalSuppressionAuditStore, ttl: number, clockValue: clock.Clock): GlobalSuppressionAuditStore {
  return new CachedGlobalSuppressionAuditStore(
    inner,
    cache.newTtlCache<GlobalSuppressionAudit>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global suppression audits. Empty fields match all. */
export class GlobalSuppressionAuditQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSuppressionAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSuppressionAudit[]): GlobalSuppressionAudit[] {
    const matched = collections.filter(items, (candidate: GlobalSuppressionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSuppressionAudits(store: GlobalSuppressionAuditStore, query: GlobalSuppressionAuditQuery): GlobalSuppressionAudit[] {
  return query.apply(store.list());
}
