import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalApprovalManifest } from "./seasonal-approval-manifest.js";

/** Keeps seasonal approval manifests by code. */
export interface SeasonalApprovalManifestStore {
  find(code: string): SeasonalApprovalManifest | undefined;
  save(item: SeasonalApprovalManifest): void;
  remove(code: string): boolean;
  list(): SeasonalApprovalManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalApprovalManifestStore implements SeasonalApprovalManifestStore {
  items: Map<string, SeasonalApprovalManifest>;
  order: string[];

  constructor(items: Map<string, SeasonalApprovalManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalApprovalManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalApprovalManifest): void {
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

  list(): SeasonalApprovalManifest[] {
    const out: SeasonalApprovalManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalApprovalManifestStore(): SeasonalApprovalManifestStore {
  return new MemorySeasonalApprovalManifestStore(new Map<string, SeasonalApprovalManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalApprovalManifestStore implements SeasonalApprovalManifestStore {
  inner: SeasonalApprovalManifestStore;
  cache: cache.TtlCache<SeasonalApprovalManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalApprovalManifestStore,
    cacheValue: cache.TtlCache<SeasonalApprovalManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalApprovalManifest | undefined {
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

  save(item: SeasonalApprovalManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalApprovalManifest[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalApprovalManifestStore(inner: SeasonalApprovalManifestStore, ttl: number, clockValue: clock.Clock): SeasonalApprovalManifestStore {
  return new CachedSeasonalApprovalManifestStore(
    inner,
    cache.newTtlCache<SeasonalApprovalManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal approval manifests. Empty fields match all. */
export class SeasonalApprovalManifestQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalApprovalManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalApprovalManifest[]): SeasonalApprovalManifest[] {
    const matched = collections.filter(items, (candidate: SeasonalApprovalManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalApprovalManifests(store: SeasonalApprovalManifestStore, query: SeasonalApprovalManifestQuery): SeasonalApprovalManifest[] {
  return query.apply(store.list());
}
