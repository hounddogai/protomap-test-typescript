import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledMentionDigest } from "./scheduled-mention-digest.js";

/** Keeps scheduled mention digests by code. */
export interface ScheduledMentionDigestStore {
  find(code: string): ScheduledMentionDigest | undefined;
  save(item: ScheduledMentionDigest): void;
  remove(code: string): boolean;
  list(): ScheduledMentionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledMentionDigestStore implements ScheduledMentionDigestStore {
  items: Map<string, ScheduledMentionDigest>;
  order: string[];

  constructor(items: Map<string, ScheduledMentionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledMentionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledMentionDigest): void {
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

  list(): ScheduledMentionDigest[] {
    const out: ScheduledMentionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledMentionDigestStore(): ScheduledMentionDigestStore {
  return new MemoryScheduledMentionDigestStore(new Map<string, ScheduledMentionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledMentionDigestStore implements ScheduledMentionDigestStore {
  inner: ScheduledMentionDigestStore;
  cache: cache.TtlCache<ScheduledMentionDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledMentionDigestStore,
    cacheValue: cache.TtlCache<ScheduledMentionDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledMentionDigest | undefined {
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

  save(item: ScheduledMentionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledMentionDigest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledMentionDigestStore(inner: ScheduledMentionDigestStore, ttl: number, clockValue: clock.Clock): ScheduledMentionDigestStore {
  return new CachedScheduledMentionDigestStore(
    inner,
    cache.newTtlCache<ScheduledMentionDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled mention digests. Empty fields match all. */
export class ScheduledMentionDigestQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledMentionDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledMentionDigest[]): ScheduledMentionDigest[] {
    const matched = collections.filter(items, (candidate: ScheduledMentionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledMentionDigests(store: ScheduledMentionDigestStore, query: ScheduledMentionDigestQuery): ScheduledMentionDigest[] {
  return query.apply(store.list());
}
