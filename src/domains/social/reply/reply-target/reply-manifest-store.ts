import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyManifest } from "./reply-manifest.js";

/** Keeps reply manifests by code. */
export interface ReplyManifestStore {
  find(code: string): ReplyManifest | undefined;
  save(item: ReplyManifest): void;
  remove(code: string): boolean;
  list(): ReplyManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyManifestStore implements ReplyManifestStore {
  items: Map<string, ReplyManifest>;
  order: string[];

  constructor(items: Map<string, ReplyManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyManifest): void {
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

  list(): ReplyManifest[] {
    const out: ReplyManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyManifestStore(): ReplyManifestStore {
  return new MemoryReplyManifestStore(new Map<string, ReplyManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyManifestStore implements ReplyManifestStore {
  inner: ReplyManifestStore;
  cache: cache.TtlCache<ReplyManifest>;
  hits: number;
  misses: number;

  constructor(inner: ReplyManifestStore, cacheValue: cache.TtlCache<ReplyManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyManifest | undefined {
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

  save(item: ReplyManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyManifest[] {
    return this.inner.list();
  }
}

export function newCachedReplyManifestStore(inner: ReplyManifestStore, ttl: number, clockValue: clock.Clock): ReplyManifestStore {
  return new CachedReplyManifestStore(inner, cache.newTtlCache<ReplyManifest>(64, ttl, clockValue), 0, 0);
}

/** Selects reply manifests. Empty fields match all. */
export class ReplyManifestQuery {
  source: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyManifest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyManifest[]): ReplyManifest[] {
    const matched = collections.filter(items, (candidate: ReplyManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyManifests(store: ReplyManifestStore, query: ReplyManifestQuery): ReplyManifest[] {
  return query.apply(store.list());
}
