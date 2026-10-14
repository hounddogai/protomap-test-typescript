import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSenderScore } from "./manual-sender-score.js";

/** Keeps manual sender scores by code. */
export interface ManualSenderScoreStore {
  find(code: string): ManualSenderScore | undefined;
  save(item: ManualSenderScore): void;
  remove(code: string): boolean;
  list(): ManualSenderScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSenderScoreStore implements ManualSenderScoreStore {
  items: Map<string, ManualSenderScore>;
  order: string[];

  constructor(items: Map<string, ManualSenderScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSenderScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSenderScore): void {
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

  list(): ManualSenderScore[] {
    const out: ManualSenderScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSenderScoreStore(): ManualSenderScoreStore {
  return new MemoryManualSenderScoreStore(new Map<string, ManualSenderScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSenderScoreStore implements ManualSenderScoreStore {
  inner: ManualSenderScoreStore;
  cache: cache.TtlCache<ManualSenderScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSenderScoreStore,
    cacheValue: cache.TtlCache<ManualSenderScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSenderScore | undefined {
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

  save(item: ManualSenderScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSenderScore[] {
    return this.inner.list();
  }
}

export function newCachedManualSenderScoreStore(inner: ManualSenderScoreStore, ttl: number, clockValue: clock.Clock): ManualSenderScoreStore {
  return new CachedManualSenderScoreStore(inner, cache.newTtlCache<ManualSenderScore>(128, ttl, clockValue), 0, 0);
}

/** Selects manual sender scores. Empty fields match all. */
export class ManualSenderScoreQuery {
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

  matches(item: ManualSenderScore): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSenderScore[]): ManualSenderScore[] {
    const matched = collections.filter(items, (candidate: ManualSenderScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSenderScores(store: ManualSenderScoreStore, query: ManualSenderScoreQuery): ManualSenderScore[] {
  return query.apply(store.list());
}
