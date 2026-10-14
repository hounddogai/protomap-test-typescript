import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyBadgeManifest } from "./legacy-badge-manifest.js";

/** Keeps legacy badge manifests by code. */
export interface LegacyBadgeManifestStore {
  find(code: string): LegacyBadgeManifest | undefined;
  save(item: LegacyBadgeManifest): void;
  remove(code: string): boolean;
  list(): LegacyBadgeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyBadgeManifestStore implements LegacyBadgeManifestStore {
  items: Map<string, LegacyBadgeManifest>;
  order: string[];

  constructor(items: Map<string, LegacyBadgeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyBadgeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyBadgeManifest): void {
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

  list(): LegacyBadgeManifest[] {
    const out: LegacyBadgeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyBadgeManifestStore(): LegacyBadgeManifestStore {
  return new MemoryLegacyBadgeManifestStore(new Map<string, LegacyBadgeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyBadgeManifestStore implements LegacyBadgeManifestStore {
  inner: LegacyBadgeManifestStore;
  cache: cache.TtlCache<LegacyBadgeManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyBadgeManifestStore,
    cacheValue: cache.TtlCache<LegacyBadgeManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyBadgeManifest | undefined {
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

  save(item: LegacyBadgeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyBadgeManifest[] {
    return this.inner.list();
  }
}

export function newCachedLegacyBadgeManifestStore(inner: LegacyBadgeManifestStore, ttl: number, clockValue: clock.Clock): LegacyBadgeManifestStore {
  return new CachedLegacyBadgeManifestStore(inner, cache.newTtlCache<LegacyBadgeManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy badge manifests. Empty fields match all. */
export class LegacyBadgeManifestQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyBadgeManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyBadgeManifest[]): LegacyBadgeManifest[] {
    const matched = collections.filter(items, (candidate: LegacyBadgeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyBadgeManifests(store: LegacyBadgeManifestStore, query: LegacyBadgeManifestQuery): LegacyBadgeManifest[] {
  return query.apply(store.list());
}
