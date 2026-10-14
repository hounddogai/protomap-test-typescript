import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalEscalationManifest } from "./global-escalation-manifest.js";

/** Keeps global escalation manifests by code. */
export interface GlobalEscalationManifestStore {
  find(code: string): GlobalEscalationManifest | undefined;
  save(item: GlobalEscalationManifest): void;
  remove(code: string): boolean;
  list(): GlobalEscalationManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalEscalationManifestStore implements GlobalEscalationManifestStore {
  items: Map<string, GlobalEscalationManifest>;
  order: string[];

  constructor(items: Map<string, GlobalEscalationManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalEscalationManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalEscalationManifest): void {
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

  list(): GlobalEscalationManifest[] {
    const out: GlobalEscalationManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalEscalationManifestStore(): GlobalEscalationManifestStore {
  return new MemoryGlobalEscalationManifestStore(new Map<string, GlobalEscalationManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalEscalationManifestStore implements GlobalEscalationManifestStore {
  inner: GlobalEscalationManifestStore;
  cache: cache.TtlCache<GlobalEscalationManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalEscalationManifestStore,
    cacheValue: cache.TtlCache<GlobalEscalationManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalEscalationManifest | undefined {
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

  save(item: GlobalEscalationManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalEscalationManifest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalEscalationManifestStore(inner: GlobalEscalationManifestStore, ttl: number, clockValue: clock.Clock): GlobalEscalationManifestStore {
  return new CachedGlobalEscalationManifestStore(
    inner,
    cache.newTtlCache<GlobalEscalationManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global escalation manifests. Empty fields match all. */
export class GlobalEscalationManifestQuery {
  segment: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalEscalationManifest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalEscalationManifest[]): GlobalEscalationManifest[] {
    const matched = collections.filter(items, (candidate: GlobalEscalationManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalEscalationManifests(store: GlobalEscalationManifestStore, query: GlobalEscalationManifestQuery): GlobalEscalationManifest[] {
  return query.apply(store.list());
}
