import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostAudit } from "./post-audit.js";

/** Keeps post audits by code. */
export interface PostAuditStore {
  find(code: string): PostAudit | undefined;
  save(item: PostAudit): void;
  remove(code: string): boolean;
  list(): PostAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostAuditStore implements PostAuditStore {
  items: Map<string, PostAudit>;
  order: string[];

  constructor(items: Map<string, PostAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostAudit): void {
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

  list(): PostAudit[] {
    const out: PostAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostAuditStore(): PostAuditStore {
  return new MemoryPostAuditStore(new Map<string, PostAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostAuditStore implements PostAuditStore {
  inner: PostAuditStore;
  cache: cache.TtlCache<PostAudit>;
  hits: number;
  misses: number;

  constructor(inner: PostAuditStore, cacheValue: cache.TtlCache<PostAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostAudit | undefined {
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

  save(item: PostAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostAudit[] {
    return this.inner.list();
  }
}

export function newCachedPostAuditStore(inner: PostAuditStore, ttl: number, clockValue: clock.Clock): PostAuditStore {
  return new CachedPostAuditStore(inner, cache.newTtlCache<PostAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects post audits. Empty fields match all. */
export class PostAuditQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostAudit[]): PostAudit[] {
    const matched = collections.filter(items, (candidate: PostAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostAudits(store: PostAuditStore, query: PostAuditQuery): PostAudit[] {
  return query.apply(store.list());
}
