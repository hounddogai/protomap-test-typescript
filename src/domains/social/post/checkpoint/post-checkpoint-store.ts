import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostCheckpoint } from "./post-checkpoint.js";

/** Keeps post checkpoints by code. */
export interface PostCheckpointStore {
  find(code: string): PostCheckpoint | undefined;
  save(item: PostCheckpoint): void;
  remove(code: string): boolean;
  list(): PostCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostCheckpointStore implements PostCheckpointStore {
  items: Map<string, PostCheckpoint>;
  order: string[];

  constructor(items: Map<string, PostCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostCheckpoint): void {
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

  list(): PostCheckpoint[] {
    const out: PostCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostCheckpointStore(): PostCheckpointStore {
  return new MemoryPostCheckpointStore(new Map<string, PostCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostCheckpointStore implements PostCheckpointStore {
  inner: PostCheckpointStore;
  cache: cache.TtlCache<PostCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PostCheckpointStore,
    cacheValue: cache.TtlCache<PostCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostCheckpoint | undefined {
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

  save(item: PostCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPostCheckpointStore(inner: PostCheckpointStore, ttl: number, clockValue: clock.Clock): PostCheckpointStore {
  return new CachedPostCheckpointStore(inner, cache.newTtlCache<PostCheckpoint>(128, ttl, clockValue), 0, 0);
}

/** Selects post checkpoints. Empty fields match all. */
export class PostCheckpointQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostCheckpoint[]): PostCheckpoint[] {
    const matched = collections.filter(items, (candidate: PostCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostCheckpoints(store: PostCheckpointStore, query: PostCheckpointQuery): PostCheckpoint[] {
  return query.apply(store.list());
}
