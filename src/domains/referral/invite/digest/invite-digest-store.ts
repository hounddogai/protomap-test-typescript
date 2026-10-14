import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteDigest } from "./invite-digest.js";

/** Keeps invite digests by code. */
export interface InviteDigestStore {
  find(code: string): InviteDigest | undefined;
  save(item: InviteDigest): void;
  remove(code: string): boolean;
  list(): InviteDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteDigestStore implements InviteDigestStore {
  items: Map<string, InviteDigest>;
  order: string[];

  constructor(items: Map<string, InviteDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteDigest): void {
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

  list(): InviteDigest[] {
    const out: InviteDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteDigestStore(): InviteDigestStore {
  return new MemoryInviteDigestStore(new Map<string, InviteDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteDigestStore implements InviteDigestStore {
  inner: InviteDigestStore;
  cache: cache.TtlCache<InviteDigest>;
  hits: number;
  misses: number;

  constructor(inner: InviteDigestStore, cacheValue: cache.TtlCache<InviteDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteDigest | undefined {
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

  save(item: InviteDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteDigest[] {
    return this.inner.list();
  }
}

export function newCachedInviteDigestStore(inner: InviteDigestStore, ttl: number, clockValue: clock.Clock): InviteDigestStore {
  return new CachedInviteDigestStore(inner, cache.newTtlCache<InviteDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects invite digests. Empty fields match all. */
export class InviteDigestQuery {
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

  matches(item: InviteDigest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteDigest[]): InviteDigest[] {
    const matched = collections.filter(items, (candidate: InviteDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteDigests(store: InviteDigestStore, query: InviteDigestQuery): InviteDigest[] {
  return query.apply(store.list());
}
