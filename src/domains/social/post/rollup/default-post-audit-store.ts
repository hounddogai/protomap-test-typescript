import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPostAudit } from "./default-post-audit.js";

/** Keeps default post audits by code. */
export interface DefaultPostAuditStore {
  find(code: string): DefaultPostAudit | undefined;
  save(item: DefaultPostAudit): void;
  remove(code: string): boolean;
  list(): DefaultPostAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPostAuditStore implements DefaultPostAuditStore {
  items: Map<string, DefaultPostAudit>;
  order: string[];

  constructor(items: Map<string, DefaultPostAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPostAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPostAudit): void {
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

  list(): DefaultPostAudit[] {
    const out: DefaultPostAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPostAuditStore(): DefaultPostAuditStore {
  return new MemoryDefaultPostAuditStore(new Map<string, DefaultPostAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPostAuditStore implements DefaultPostAuditStore {
  inner: DefaultPostAuditStore;
  cache: cache.TtlCache<DefaultPostAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPostAuditStore,
    cacheValue: cache.TtlCache<DefaultPostAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPostAudit | undefined {
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

  save(item: DefaultPostAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPostAudit[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPostAuditStore(inner: DefaultPostAuditStore, ttl: number, clockValue: clock.Clock): DefaultPostAuditStore {
  return new CachedDefaultPostAuditStore(inner, cache.newTtlCache<DefaultPostAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects default post audits. Empty fields match all. */
export class DefaultPostAuditQuery {
  segment: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPostAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPostAudit[]): DefaultPostAudit[] {
    const matched = collections.filter(items, (candidate: DefaultPostAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPostAudits(store: DefaultPostAuditStore, query: DefaultPostAuditQuery): DefaultPostAudit[] {
  return query.apply(store.list());
}
