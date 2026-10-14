import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFraudCheckScore } from "./default-fraud-check-score.js";

/** Keeps default fraud check scores by code. */
export interface DefaultFraudCheckScoreStore {
  find(code: string): DefaultFraudCheckScore | undefined;
  save(item: DefaultFraudCheckScore): void;
  remove(code: string): boolean;
  list(): DefaultFraudCheckScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFraudCheckScoreStore implements DefaultFraudCheckScoreStore {
  items: Map<string, DefaultFraudCheckScore>;
  order: string[];

  constructor(items: Map<string, DefaultFraudCheckScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFraudCheckScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFraudCheckScore): void {
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

  list(): DefaultFraudCheckScore[] {
    const out: DefaultFraudCheckScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFraudCheckScoreStore(): DefaultFraudCheckScoreStore {
  return new MemoryDefaultFraudCheckScoreStore(new Map<string, DefaultFraudCheckScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFraudCheckScoreStore implements DefaultFraudCheckScoreStore {
  inner: DefaultFraudCheckScoreStore;
  cache: cache.TtlCache<DefaultFraudCheckScore>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFraudCheckScoreStore,
    cacheValue: cache.TtlCache<DefaultFraudCheckScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFraudCheckScore | undefined {
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

  save(item: DefaultFraudCheckScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFraudCheckScore[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFraudCheckScoreStore(inner: DefaultFraudCheckScoreStore, ttl: number, clockValue: clock.Clock): DefaultFraudCheckScoreStore {
  return new CachedDefaultFraudCheckScoreStore(
    inner,
    cache.newTtlCache<DefaultFraudCheckScore>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default fraud check scores. Empty fields match all. */
export class DefaultFraudCheckScoreQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFraudCheckScore): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFraudCheckScore[]): DefaultFraudCheckScore[] {
    const matched = collections.filter(items, (candidate: DefaultFraudCheckScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFraudCheckScores(store: DefaultFraudCheckScoreStore, query: DefaultFraudCheckScoreQuery): DefaultFraudCheckScore[] {
  return query.apply(store.list());
}
