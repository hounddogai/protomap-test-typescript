import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryChallengeManifest } from "./primary-challenge-manifest.js";

/** Keeps primary challenge manifests by code. */
export interface PrimaryChallengeManifestStore {
  find(code: string): PrimaryChallengeManifest | undefined;
  save(item: PrimaryChallengeManifest): void;
  remove(code: string): boolean;
  list(): PrimaryChallengeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryChallengeManifestStore implements PrimaryChallengeManifestStore {
  items: Map<string, PrimaryChallengeManifest>;
  order: string[];

  constructor(items: Map<string, PrimaryChallengeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryChallengeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryChallengeManifest): void {
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

  list(): PrimaryChallengeManifest[] {
    const out: PrimaryChallengeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryChallengeManifestStore(): PrimaryChallengeManifestStore {
  return new MemoryPrimaryChallengeManifestStore(new Map<string, PrimaryChallengeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryChallengeManifestStore implements PrimaryChallengeManifestStore {
  inner: PrimaryChallengeManifestStore;
  cache: cache.TtlCache<PrimaryChallengeManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryChallengeManifestStore,
    cacheValue: cache.TtlCache<PrimaryChallengeManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryChallengeManifest | undefined {
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

  save(item: PrimaryChallengeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryChallengeManifest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryChallengeManifestStore(inner: PrimaryChallengeManifestStore, ttl: number, clockValue: clock.Clock): PrimaryChallengeManifestStore {
  return new CachedPrimaryChallengeManifestStore(
    inner,
    cache.newTtlCache<PrimaryChallengeManifest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary challenge manifests. Empty fields match all. */
export class PrimaryChallengeManifestQuery {
  category: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minStartsAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryChallengeManifest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryChallengeManifest[]): PrimaryChallengeManifest[] {
    const matched = collections.filter(items, (candidate: PrimaryChallengeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryChallengeManifests(store: PrimaryChallengeManifestStore, query: PrimaryChallengeManifestQuery): PrimaryChallengeManifest[] {
  return query.apply(store.list());
}
