import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionManifest } from "./mention-manifest.js";

/** Keeps mention manifests by code. */
export interface MentionManifestStore {
  find(code: string): MentionManifest | undefined;
  save(item: MentionManifest): void;
  remove(code: string): boolean;
  list(): MentionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionManifestStore implements MentionManifestStore {
  items: Map<string, MentionManifest>;
  order: string[];

  constructor(items: Map<string, MentionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionManifest): void {
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

  list(): MentionManifest[] {
    const out: MentionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionManifestStore(): MentionManifestStore {
  return new MemoryMentionManifestStore(new Map<string, MentionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionManifestStore implements MentionManifestStore {
  inner: MentionManifestStore;
  cache: cache.TtlCache<MentionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionManifestStore,
    cacheValue: cache.TtlCache<MentionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionManifest | undefined {
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

  save(item: MentionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionManifest[] {
    return this.inner.list();
  }
}

export function newCachedMentionManifestStore(inner: MentionManifestStore, ttl: number, clockValue: clock.Clock): MentionManifestStore {
  return new CachedMentionManifestStore(inner, cache.newTtlCache<MentionManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention manifests. Empty fields match all. */
export class MentionManifestQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionManifest[]): MentionManifest[] {
    const matched = collections.filter(items, (candidate: MentionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionManifests(store: MentionManifestStore, query: MentionManifestQuery): MentionManifest[] {
  return query.apply(store.list());
}
