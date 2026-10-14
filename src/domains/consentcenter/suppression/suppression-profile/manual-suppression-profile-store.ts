import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSuppressionProfile } from "./manual-suppression-profile.js";

/** Keeps manual suppression profiles by code. */
export interface ManualSuppressionProfileStore {
  find(code: string): ManualSuppressionProfile | undefined;
  save(item: ManualSuppressionProfile): void;
  remove(code: string): boolean;
  list(): ManualSuppressionProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSuppressionProfileStore implements ManualSuppressionProfileStore {
  items: Map<string, ManualSuppressionProfile>;
  order: string[];

  constructor(items: Map<string, ManualSuppressionProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSuppressionProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSuppressionProfile): void {
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

  list(): ManualSuppressionProfile[] {
    const out: ManualSuppressionProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSuppressionProfileStore(): ManualSuppressionProfileStore {
  return new MemoryManualSuppressionProfileStore(new Map<string, ManualSuppressionProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSuppressionProfileStore implements ManualSuppressionProfileStore {
  inner: ManualSuppressionProfileStore;
  cache: cache.TtlCache<ManualSuppressionProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSuppressionProfileStore,
    cacheValue: cache.TtlCache<ManualSuppressionProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSuppressionProfile | undefined {
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

  save(item: ManualSuppressionProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSuppressionProfile[] {
    return this.inner.list();
  }
}

export function newCachedManualSuppressionProfileStore(inner: ManualSuppressionProfileStore, ttl: number, clockValue: clock.Clock): ManualSuppressionProfileStore {
  return new CachedManualSuppressionProfileStore(
    inner,
    cache.newTtlCache<ManualSuppressionProfile>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual suppression profiles. Empty fields match all. */
export class ManualSuppressionProfileQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSuppressionProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSuppressionProfile[]): ManualSuppressionProfile[] {
    const matched = collections.filter(items, (candidate: ManualSuppressionProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSuppressionProfiles(store: ManualSuppressionProfileStore, query: ManualSuppressionProfileQuery): ManualSuppressionProfile[] {
  return query.apply(store.list());
}
