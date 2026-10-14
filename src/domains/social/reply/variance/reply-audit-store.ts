import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyAudit } from "./reply-audit.js";

/** Keeps reply audits by code. */
export interface ReplyAuditStore {
  find(code: string): ReplyAudit | undefined;
  save(item: ReplyAudit): void;
  remove(code: string): boolean;
  list(): ReplyAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyAuditStore implements ReplyAuditStore {
  items: Map<string, ReplyAudit>;
  order: string[];

  constructor(items: Map<string, ReplyAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyAudit): void {
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

  list(): ReplyAudit[] {
    const out: ReplyAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyAuditStore(): ReplyAuditStore {
  return new MemoryReplyAuditStore(new Map<string, ReplyAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyAuditStore implements ReplyAuditStore {
  inner: ReplyAuditStore;
  cache: cache.TtlCache<ReplyAudit>;
  hits: number;
  misses: number;

  constructor(inner: ReplyAuditStore, cacheValue: cache.TtlCache<ReplyAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyAudit | undefined {
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

  save(item: ReplyAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyAudit[] {
    return this.inner.list();
  }
}

export function newCachedReplyAuditStore(inner: ReplyAuditStore, ttl: number, clockValue: clock.Clock): ReplyAuditStore {
  return new CachedReplyAuditStore(inner, cache.newTtlCache<ReplyAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects reply audits. Empty fields match all. */
export class ReplyAuditQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyAudit[]): ReplyAudit[] {
    const matched = collections.filter(items, (candidate: ReplyAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyAudits(store: ReplyAuditStore, query: ReplyAuditQuery): ReplyAudit[] {
  return query.apply(store.list());
}
