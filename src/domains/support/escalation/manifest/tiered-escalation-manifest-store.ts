import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredEscalationManifest } from "./tiered-escalation-manifest.js";

/** Keeps tiered escalation manifests by code. */
export interface TieredEscalationManifestStore {
  find(code: string): TieredEscalationManifest | undefined;
  save(item: TieredEscalationManifest): void;
  remove(code: string): boolean;
  list(): TieredEscalationManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredEscalationManifestStore implements TieredEscalationManifestStore {
  items: Map<string, TieredEscalationManifest>;
  order: string[];

  constructor(items: Map<string, TieredEscalationManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredEscalationManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredEscalationManifest): void {
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

  list(): TieredEscalationManifest[] {
    const out: TieredEscalationManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredEscalationManifestStore(): TieredEscalationManifestStore {
  return new MemoryTieredEscalationManifestStore(new Map<string, TieredEscalationManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredEscalationManifestStore implements TieredEscalationManifestStore {
  inner: TieredEscalationManifestStore;
  cache: cache.TtlCache<TieredEscalationManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredEscalationManifestStore,
    cacheValue: cache.TtlCache<TieredEscalationManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredEscalationManifest | undefined {
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

  save(item: TieredEscalationManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredEscalationManifest[] {
    return this.inner.list();
  }
}

export function newCachedTieredEscalationManifestStore(inner: TieredEscalationManifestStore, ttl: number, clockValue: clock.Clock): TieredEscalationManifestStore {
  return new CachedTieredEscalationManifestStore(
    inner,
    cache.newTtlCache<TieredEscalationManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered escalation manifests. Empty fields match all. */
export class TieredEscalationManifestQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredEscalationManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredEscalationManifest[]): TieredEscalationManifest[] {
    const matched = collections.filter(items, (candidate: TieredEscalationManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredEscalationManifests(store: TieredEscalationManifestStore, query: TieredEscalationManifestQuery): TieredEscalationManifest[] {
  return query.apply(store.list());
}
