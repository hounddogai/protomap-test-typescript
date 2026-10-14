import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultInsightAudit } from "./default-insight-audit.js";

/** Keeps default insight audits by code. */
export interface DefaultInsightAuditStore {
  find(code: string): DefaultInsightAudit | undefined;
  save(item: DefaultInsightAudit): void;
  remove(code: string): boolean;
  list(): DefaultInsightAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultInsightAuditStore implements DefaultInsightAuditStore {
  items: Map<string, DefaultInsightAudit>;
  order: string[];

  constructor(items: Map<string, DefaultInsightAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultInsightAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultInsightAudit): void {
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

  list(): DefaultInsightAudit[] {
    const out: DefaultInsightAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultInsightAuditStore(): DefaultInsightAuditStore {
  return new MemoryDefaultInsightAuditStore(new Map<string, DefaultInsightAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultInsightAuditStore implements DefaultInsightAuditStore {
  inner: DefaultInsightAuditStore;
  cache: cache.TtlCache<DefaultInsightAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultInsightAuditStore,
    cacheValue: cache.TtlCache<DefaultInsightAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultInsightAudit | undefined {
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

  save(item: DefaultInsightAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultInsightAudit[] {
    return this.inner.list();
  }
}

export function newCachedDefaultInsightAuditStore(inner: DefaultInsightAuditStore, ttl: number, clockValue: clock.Clock): DefaultInsightAuditStore {
  return new CachedDefaultInsightAuditStore(inner, cache.newTtlCache<DefaultInsightAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects default insight audits. Empty fields match all. */
export class DefaultInsightAuditQuery {
  channel: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBid: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultInsightAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultInsightAudit[]): DefaultInsightAudit[] {
    const matched = collections.filter(items, (candidate: DefaultInsightAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultInsightAudits(store: DefaultInsightAuditStore, query: DefaultInsightAuditQuery): DefaultInsightAudit[] {
  return query.apply(store.list());
}
