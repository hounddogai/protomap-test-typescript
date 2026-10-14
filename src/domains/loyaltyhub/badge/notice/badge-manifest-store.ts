import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeManifest } from "./badge-manifest.js";

/** Keeps badge manifests by code. */
export interface BadgeManifestStore {
  find(code: string): BadgeManifest | undefined;
  save(item: BadgeManifest): void;
  remove(code: string): boolean;
  list(): BadgeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeManifestStore implements BadgeManifestStore {
  items: Map<string, BadgeManifest>;
  order: string[];

  constructor(items: Map<string, BadgeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeManifest): void {
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

  list(): BadgeManifest[] {
    const out: BadgeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeManifestStore(): BadgeManifestStore {
  return new MemoryBadgeManifestStore(new Map<string, BadgeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeManifestStore implements BadgeManifestStore {
  inner: BadgeManifestStore;
  cache: cache.TtlCache<BadgeManifest>;
  hits: number;
  misses: number;

  constructor(inner: BadgeManifestStore, cacheValue: cache.TtlCache<BadgeManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeManifest | undefined {
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

  save(item: BadgeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeManifest[] {
    return this.inner.list();
  }
}

export function newCachedBadgeManifestStore(inner: BadgeManifestStore, ttl: number, clockValue: clock.Clock): BadgeManifestStore {
  return new CachedBadgeManifestStore(inner, cache.newTtlCache<BadgeManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects badge manifests. Empty fields match all. */
export class BadgeManifestQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeManifest[]): BadgeManifest[] {
    const matched = collections.filter(items, (candidate: BadgeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeManifests(store: BadgeManifestStore, query: BadgeManifestQuery): BadgeManifest[] {
  return query.apply(store.list());
}
