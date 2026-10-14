import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplySnapshot } from "./reply-snapshot.js";

/** Keeps reply snapshots by code. */
export interface ReplySnapshotStore {
  find(code: string): ReplySnapshot | undefined;
  save(item: ReplySnapshot): void;
  remove(code: string): boolean;
  list(): ReplySnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplySnapshotStore implements ReplySnapshotStore {
  items: Map<string, ReplySnapshot>;
  order: string[];

  constructor(items: Map<string, ReplySnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplySnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplySnapshot): void {
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

  list(): ReplySnapshot[] {
    const out: ReplySnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplySnapshotStore(): ReplySnapshotStore {
  return new MemoryReplySnapshotStore(new Map<string, ReplySnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplySnapshotStore implements ReplySnapshotStore {
  inner: ReplySnapshotStore;
  cache: cache.TtlCache<ReplySnapshot>;
  hits: number;
  misses: number;

  constructor(inner: ReplySnapshotStore, cacheValue: cache.TtlCache<ReplySnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplySnapshot | undefined {
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

  save(item: ReplySnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplySnapshot[] {
    return this.inner.list();
  }
}

export function newCachedReplySnapshotStore(inner: ReplySnapshotStore, ttl: number, clockValue: clock.Clock): ReplySnapshotStore {
  return new CachedReplySnapshotStore(inner, cache.newTtlCache<ReplySnapshot>(512, ttl, clockValue), 0, 0);
}

/** Selects reply snapshots. Empty fields match all. */
export class ReplySnapshotQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplySnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplySnapshot[]): ReplySnapshot[] {
    const matched = collections.filter(items, (candidate: ReplySnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplySnapshots(store: ReplySnapshotStore, query: ReplySnapshotQuery): ReplySnapshot[] {
  return query.apply(store.list());
}
