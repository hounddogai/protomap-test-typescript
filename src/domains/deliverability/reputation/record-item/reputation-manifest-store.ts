import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationManifest } from "./reputation-manifest.js";

/** Keeps reputation manifests by code. */
export interface ReputationManifestStore {
  find(code: string): ReputationManifest | undefined;
  save(item: ReputationManifest): void;
  remove(code: string): boolean;
  list(): ReputationManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationManifestStore implements ReputationManifestStore {
  items: Map<string, ReputationManifest>;
  order: string[];

  constructor(items: Map<string, ReputationManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationManifest): void {
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

  list(): ReputationManifest[] {
    const out: ReputationManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationManifestStore(): ReputationManifestStore {
  return new MemoryReputationManifestStore(new Map<string, ReputationManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationManifestStore implements ReputationManifestStore {
  inner: ReputationManifestStore;
  cache: cache.TtlCache<ReputationManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationManifestStore,
    cacheValue: cache.TtlCache<ReputationManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationManifest | undefined {
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

  save(item: ReputationManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationManifest[] {
    return this.inner.list();
  }
}

export function newCachedReputationManifestStore(inner: ReputationManifestStore, ttl: number, clockValue: clock.Clock): ReputationManifestStore {
  return new CachedReputationManifestStore(inner, cache.newTtlCache<ReputationManifest>(128, ttl, clockValue), 0, 0);
}

/** Selects reputation manifests. Empty fields match all. */
export class ReputationManifestQuery {
  channel: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minImpressions: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationManifest[]): ReputationManifest[] {
    const matched = collections.filter(items, (candidate: ReputationManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationManifests(store: ReputationManifestStore, query: ReputationManifestQuery): ReputationManifest[] {
  return query.apply(store.list());
}
