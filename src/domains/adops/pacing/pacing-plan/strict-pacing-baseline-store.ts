import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPacingBaseline } from "./strict-pacing-baseline.js";

/** Keeps strict pacing baselines by code. */
export interface StrictPacingBaselineStore {
  find(code: string): StrictPacingBaseline | undefined;
  save(item: StrictPacingBaseline): void;
  remove(code: string): boolean;
  list(): StrictPacingBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPacingBaselineStore implements StrictPacingBaselineStore {
  items: Map<string, StrictPacingBaseline>;
  order: string[];

  constructor(items: Map<string, StrictPacingBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPacingBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPacingBaseline): void {
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

  list(): StrictPacingBaseline[] {
    const out: StrictPacingBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPacingBaselineStore(): StrictPacingBaselineStore {
  return new MemoryStrictPacingBaselineStore(new Map<string, StrictPacingBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPacingBaselineStore implements StrictPacingBaselineStore {
  inner: StrictPacingBaselineStore;
  cache: cache.TtlCache<StrictPacingBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPacingBaselineStore,
    cacheValue: cache.TtlCache<StrictPacingBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPacingBaseline | undefined {
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

  save(item: StrictPacingBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPacingBaseline[] {
    return this.inner.list();
  }
}

export function newCachedStrictPacingBaselineStore(inner: StrictPacingBaselineStore, ttl: number, clockValue: clock.Clock): StrictPacingBaselineStore {
  return new CachedStrictPacingBaselineStore(
    inner,
    cache.newTtlCache<StrictPacingBaseline>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict pacing baselines. Empty fields match all. */
export class StrictPacingBaselineQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPacingBaseline): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPacingBaseline[]): StrictPacingBaseline[] {
    const matched = collections.filter(items, (candidate: StrictPacingBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPacingBaselines(store: StrictPacingBaselineStore, query: StrictPacingBaselineQuery): StrictPacingBaseline[] {
  return query.apply(store.list());
}
