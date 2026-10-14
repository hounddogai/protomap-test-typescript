import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofManifest } from "./proof-manifest.js";

/** Keeps proof manifests by code. */
export interface ProofManifestStore {
  find(code: string): ProofManifest | undefined;
  save(item: ProofManifest): void;
  remove(code: string): boolean;
  list(): ProofManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofManifestStore implements ProofManifestStore {
  items: Map<string, ProofManifest>;
  order: string[];

  constructor(items: Map<string, ProofManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofManifest): void {
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

  list(): ProofManifest[] {
    const out: ProofManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofManifestStore(): ProofManifestStore {
  return new MemoryProofManifestStore(new Map<string, ProofManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofManifestStore implements ProofManifestStore {
  inner: ProofManifestStore;
  cache: cache.TtlCache<ProofManifest>;
  hits: number;
  misses: number;

  constructor(inner: ProofManifestStore, cacheValue: cache.TtlCache<ProofManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofManifest | undefined {
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

  save(item: ProofManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofManifest[] {
    return this.inner.list();
  }
}

export function newCachedProofManifestStore(inner: ProofManifestStore, ttl: number, clockValue: clock.Clock): ProofManifestStore {
  return new CachedProofManifestStore(inner, cache.newTtlCache<ProofManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects proof manifests. Empty fields match all. */
export class ProofManifestQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofManifest[]): ProofManifest[] {
    const matched = collections.filter(items, (candidate: ProofManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofManifests(store: ProofManifestStore, query: ProofManifestQuery): ProofManifest[] {
  return query.apply(store.list());
}
