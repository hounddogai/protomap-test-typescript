import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationManifest } from "./escalation-manifest.js";

/** Keeps escalation manifests by code. */
export interface EscalationManifestStore {
  find(code: string): EscalationManifest | undefined;
  save(item: EscalationManifest): void;
  remove(code: string): boolean;
  list(): EscalationManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationManifestStore implements EscalationManifestStore {
  items: Map<string, EscalationManifest>;
  order: string[];

  constructor(items: Map<string, EscalationManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationManifest): void {
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

  list(): EscalationManifest[] {
    const out: EscalationManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationManifestStore(): EscalationManifestStore {
  return new MemoryEscalationManifestStore(new Map<string, EscalationManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationManifestStore implements EscalationManifestStore {
  inner: EscalationManifestStore;
  cache: cache.TtlCache<EscalationManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationManifestStore,
    cacheValue: cache.TtlCache<EscalationManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationManifest | undefined {
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

  save(item: EscalationManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationManifest[] {
    return this.inner.list();
  }
}

export function newCachedEscalationManifestStore(inner: EscalationManifestStore, ttl: number, clockValue: clock.Clock): EscalationManifestStore {
  return new CachedEscalationManifestStore(inner, cache.newTtlCache<EscalationManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation manifests. Empty fields match all. */
export class EscalationManifestQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationManifest[]): EscalationManifest[] {
    const matched = collections.filter(items, (candidate: EscalationManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationManifests(store: EscalationManifestStore, query: EscalationManifestQuery): EscalationManifest[] {
  return query.apply(store.list());
}
