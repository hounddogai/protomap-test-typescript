import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledStreakManifest } from "./scheduled-streak-manifest.js";

/** Keeps scheduled streak manifests by code. */
export interface ScheduledStreakManifestStore {
  find(code: string): ScheduledStreakManifest | undefined;
  save(item: ScheduledStreakManifest): void;
  remove(code: string): boolean;
  list(): ScheduledStreakManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledStreakManifestStore implements ScheduledStreakManifestStore {
  items: Map<string, ScheduledStreakManifest>;
  order: string[];

  constructor(items: Map<string, ScheduledStreakManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledStreakManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledStreakManifest): void {
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

  list(): ScheduledStreakManifest[] {
    const out: ScheduledStreakManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledStreakManifestStore(): ScheduledStreakManifestStore {
  return new MemoryScheduledStreakManifestStore(new Map<string, ScheduledStreakManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledStreakManifestStore implements ScheduledStreakManifestStore {
  inner: ScheduledStreakManifestStore;
  cache: cache.TtlCache<ScheduledStreakManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledStreakManifestStore,
    cacheValue: cache.TtlCache<ScheduledStreakManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledStreakManifest | undefined {
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

  save(item: ScheduledStreakManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledStreakManifest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledStreakManifestStore(inner: ScheduledStreakManifestStore, ttl: number, clockValue: clock.Clock): ScheduledStreakManifestStore {
  return new CachedScheduledStreakManifestStore(
    inner,
    cache.newTtlCache<ScheduledStreakManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled streak manifests. Empty fields match all. */
export class ScheduledStreakManifestQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledStreakManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledStreakManifest[]): ScheduledStreakManifest[] {
    const matched = collections.filter(items, (candidate: ScheduledStreakManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledStreakManifests(store: ScheduledStreakManifestStore, query: ScheduledStreakManifestQuery): ScheduledStreakManifest[] {
  return query.apply(store.list());
}
