import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeMapping } from "./challenge-mapping.js";

/** Keeps challenge mappings by code. */
export interface ChallengeMappingStore {
  find(code: string): ChallengeMapping | undefined;
  save(item: ChallengeMapping): void;
  remove(code: string): boolean;
  list(): ChallengeMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeMappingStore implements ChallengeMappingStore {
  items: Map<string, ChallengeMapping>;
  order: string[];

  constructor(items: Map<string, ChallengeMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeMapping): void {
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

  list(): ChallengeMapping[] {
    const out: ChallengeMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeMappingStore(): ChallengeMappingStore {
  return new MemoryChallengeMappingStore(new Map<string, ChallengeMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeMappingStore implements ChallengeMappingStore {
  inner: ChallengeMappingStore;
  cache: cache.TtlCache<ChallengeMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeMappingStore,
    cacheValue: cache.TtlCache<ChallengeMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeMapping | undefined {
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

  save(item: ChallengeMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeMapping[] {
    return this.inner.list();
  }
}

export function newCachedChallengeMappingStore(inner: ChallengeMappingStore, ttl: number, clockValue: clock.Clock): ChallengeMappingStore {
  return new CachedChallengeMappingStore(inner, cache.newTtlCache<ChallengeMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects challenge mappings. Empty fields match all. */
export class ChallengeMappingQuery {
  source: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWeight: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeMapping): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeMapping[]): ChallengeMapping[] {
    const matched = collections.filter(items, (candidate: ChallengeMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeMappings(store: ChallengeMappingStore, query: ChallengeMappingQuery): ChallengeMapping[] {
  return query.apply(store.list());
}
