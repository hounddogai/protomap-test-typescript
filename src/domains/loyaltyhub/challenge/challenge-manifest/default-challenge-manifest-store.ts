import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultChallengeManifest } from "./default-challenge-manifest.js";

/** Keeps default challenge manifests by code. */
export interface DefaultChallengeManifestStore {
  find(code: string): DefaultChallengeManifest | undefined;
  save(item: DefaultChallengeManifest): void;
  remove(code: string): boolean;
  list(): DefaultChallengeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultChallengeManifestStore implements DefaultChallengeManifestStore {
  items: Map<string, DefaultChallengeManifest>;
  order: string[];

  constructor(items: Map<string, DefaultChallengeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultChallengeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultChallengeManifest): void {
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

  list(): DefaultChallengeManifest[] {
    const out: DefaultChallengeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultChallengeManifestStore(): DefaultChallengeManifestStore {
  return new MemoryDefaultChallengeManifestStore(new Map<string, DefaultChallengeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultChallengeManifestStore implements DefaultChallengeManifestStore {
  inner: DefaultChallengeManifestStore;
  cache: cache.TtlCache<DefaultChallengeManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultChallengeManifestStore,
    cacheValue: cache.TtlCache<DefaultChallengeManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultChallengeManifest | undefined {
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

  save(item: DefaultChallengeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultChallengeManifest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultChallengeManifestStore(inner: DefaultChallengeManifestStore, ttl: number, clockValue: clock.Clock): DefaultChallengeManifestStore {
  return new CachedDefaultChallengeManifestStore(
    inner,
    cache.newTtlCache<DefaultChallengeManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default challenge manifests. Empty fields match all. */
export class DefaultChallengeManifestQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultChallengeManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultChallengeManifest[]): DefaultChallengeManifest[] {
    const matched = collections.filter(items, (candidate: DefaultChallengeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultChallengeManifests(store: DefaultChallengeManifestStore, query: DefaultChallengeManifestQuery): DefaultChallengeManifest[] {
  return query.apply(store.list());
}
