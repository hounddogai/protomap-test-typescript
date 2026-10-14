import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostSnapshot } from "./post-snapshot.js";

/** Keeps post snapshots by code. */
export interface PostSnapshotStore {
  find(code: string): PostSnapshot | undefined;
  save(item: PostSnapshot): void;
  remove(code: string): boolean;
  list(): PostSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostSnapshotStore implements PostSnapshotStore {
  items: Map<string, PostSnapshot>;
  order: string[];

  constructor(items: Map<string, PostSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostSnapshot): void {
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

  list(): PostSnapshot[] {
    const out: PostSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostSnapshotStore(): PostSnapshotStore {
  return new MemoryPostSnapshotStore(new Map<string, PostSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostSnapshotStore implements PostSnapshotStore {
  inner: PostSnapshotStore;
  cache: cache.TtlCache<PostSnapshot>;
  hits: number;
  misses: number;

  constructor(inner: PostSnapshotStore, cacheValue: cache.TtlCache<PostSnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostSnapshot | undefined {
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

  save(item: PostSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPostSnapshotStore(inner: PostSnapshotStore, ttl: number, clockValue: clock.Clock): PostSnapshotStore {
  return new CachedPostSnapshotStore(inner, cache.newTtlCache<PostSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects post snapshots. Empty fields match all. */
export class PostSnapshotQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostSnapshot[]): PostSnapshot[] {
    const matched = collections.filter(items, (candidate: PostSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostSnapshots(store: PostSnapshotStore, query: PostSnapshotQuery): PostSnapshot[] {
  return query.apply(store.list());
}
