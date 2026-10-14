import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathAudit } from "./path-audit.js";

/** Keeps path audits by code. */
export interface PathAuditStore {
  find(code: string): PathAudit | undefined;
  save(item: PathAudit): void;
  remove(code: string): boolean;
  list(): PathAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathAuditStore implements PathAuditStore {
  items: Map<string, PathAudit>;
  order: string[];

  constructor(items: Map<string, PathAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathAudit): void {
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

  list(): PathAudit[] {
    const out: PathAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathAuditStore(): PathAuditStore {
  return new MemoryPathAuditStore(new Map<string, PathAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathAuditStore implements PathAuditStore {
  inner: PathAuditStore;
  cache: cache.TtlCache<PathAudit>;
  hits: number;
  misses: number;

  constructor(inner: PathAuditStore, cacheValue: cache.TtlCache<PathAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathAudit | undefined {
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

  save(item: PathAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathAudit[] {
    return this.inner.list();
  }
}

export function newCachedPathAuditStore(inner: PathAuditStore, ttl: number, clockValue: clock.Clock): PathAuditStore {
  return new CachedPathAuditStore(inner, cache.newTtlCache<PathAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects path audits. Empty fields match all. */
export class PathAuditQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathAudit[]): PathAudit[] {
    const matched = collections.filter(items, (candidate: PathAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathAudits(store: PathAuditStore, query: PathAuditQuery): PathAudit[] {
  return query.apply(store.list());
}
