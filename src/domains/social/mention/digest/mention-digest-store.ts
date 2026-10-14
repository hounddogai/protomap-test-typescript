import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionDigest } from "./mention-digest.js";

/** Keeps mention digests by code. */
export interface MentionDigestStore {
  find(code: string): MentionDigest | undefined;
  save(item: MentionDigest): void;
  remove(code: string): boolean;
  list(): MentionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionDigestStore implements MentionDigestStore {
  items: Map<string, MentionDigest>;
  order: string[];

  constructor(items: Map<string, MentionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionDigest): void {
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

  list(): MentionDigest[] {
    const out: MentionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionDigestStore(): MentionDigestStore {
  return new MemoryMentionDigestStore(new Map<string, MentionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionDigestStore implements MentionDigestStore {
  inner: MentionDigestStore;
  cache: cache.TtlCache<MentionDigest>;
  hits: number;
  misses: number;

  constructor(inner: MentionDigestStore, cacheValue: cache.TtlCache<MentionDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionDigest | undefined {
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

  save(item: MentionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionDigest[] {
    return this.inner.list();
  }
}

export function newCachedMentionDigestStore(inner: MentionDigestStore, ttl: number, clockValue: clock.Clock): MentionDigestStore {
  return new CachedMentionDigestStore(inner, cache.newTtlCache<MentionDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects mention digests. Empty fields match all. */
export class MentionDigestQuery {
  segment: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCapacity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionDigest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionDigest[]): MentionDigest[] {
    const matched = collections.filter(items, (candidate: MentionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionDigests(store: MentionDigestStore, query: MentionDigestQuery): MentionDigest[] {
  return query.apply(store.list());
}
