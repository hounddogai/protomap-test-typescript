import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictActivationManifest } from "./strict-activation-manifest.js";

/** Keeps strict activation manifests by code. */
export interface StrictActivationManifestStore {
  find(code: string): StrictActivationManifest | undefined;
  save(item: StrictActivationManifest): void;
  remove(code: string): boolean;
  list(): StrictActivationManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictActivationManifestStore implements StrictActivationManifestStore {
  items: Map<string, StrictActivationManifest>;
  order: string[];

  constructor(items: Map<string, StrictActivationManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictActivationManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictActivationManifest): void {
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

  list(): StrictActivationManifest[] {
    const out: StrictActivationManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictActivationManifestStore(): StrictActivationManifestStore {
  return new MemoryStrictActivationManifestStore(new Map<string, StrictActivationManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictActivationManifestStore implements StrictActivationManifestStore {
  inner: StrictActivationManifestStore;
  cache: cache.TtlCache<StrictActivationManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictActivationManifestStore,
    cacheValue: cache.TtlCache<StrictActivationManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictActivationManifest | undefined {
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

  save(item: StrictActivationManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictActivationManifest[] {
    return this.inner.list();
  }
}

export function newCachedStrictActivationManifestStore(inner: StrictActivationManifestStore, ttl: number, clockValue: clock.Clock): StrictActivationManifestStore {
  return new CachedStrictActivationManifestStore(
    inner,
    cache.newTtlCache<StrictActivationManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict activation manifests. Empty fields match all. */
export class StrictActivationManifestQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictActivationManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictActivationManifest[]): StrictActivationManifest[] {
    const matched = collections.filter(items, (candidate: StrictActivationManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictActivationManifests(store: StrictActivationManifestStore, query: StrictActivationManifestQuery): StrictActivationManifest[] {
  return query.apply(store.list());
}
