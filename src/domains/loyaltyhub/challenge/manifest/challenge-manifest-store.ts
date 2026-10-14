import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeManifest } from "./challenge-manifest.js";

/** Keeps challenge manifests by code. */
export interface ChallengeManifestStore {
  find(code: string): ChallengeManifest | undefined;
  save(item: ChallengeManifest): void;
  remove(code: string): boolean;
  list(): ChallengeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeManifestStore implements ChallengeManifestStore {
  items: Map<string, ChallengeManifest>;
  order: string[];

  constructor(items: Map<string, ChallengeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeManifest): void {
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

  list(): ChallengeManifest[] {
    const out: ChallengeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeManifestStore(): ChallengeManifestStore {
  return new MemoryChallengeManifestStore(new Map<string, ChallengeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeManifestStore implements ChallengeManifestStore {
  inner: ChallengeManifestStore;
  cache: cache.TtlCache<ChallengeManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeManifestStore,
    cacheValue: cache.TtlCache<ChallengeManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeManifest | undefined {
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

  save(item: ChallengeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeManifest[] {
    return this.inner.list();
  }
}

export function newCachedChallengeManifestStore(inner: ChallengeManifestStore, ttl: number, clockValue: clock.Clock): ChallengeManifestStore {
  return new CachedChallengeManifestStore(inner, cache.newTtlCache<ChallengeManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects challenge manifests. Empty fields match all. */
export class ChallengeManifestQuery {
  region: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minPriority: number, statuses: string[], limit: number) {
    this.region = region;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeManifest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeManifest[]): ChallengeManifest[] {
    const matched = collections.filter(items, (candidate: ChallengeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeManifests(store: ChallengeManifestStore, query: ChallengeManifestQuery): ChallengeManifest[] {
  return query.apply(store.list());
}
