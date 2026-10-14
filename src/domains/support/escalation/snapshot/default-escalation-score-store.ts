import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultEscalationScore } from "./default-escalation-score.js";

/** Keeps default escalation scores by code. */
export interface DefaultEscalationScoreStore {
  find(code: string): DefaultEscalationScore | undefined;
  save(item: DefaultEscalationScore): void;
  remove(code: string): boolean;
  list(): DefaultEscalationScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultEscalationScoreStore implements DefaultEscalationScoreStore {
  items: Map<string, DefaultEscalationScore>;
  order: string[];

  constructor(items: Map<string, DefaultEscalationScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultEscalationScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultEscalationScore): void {
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

  list(): DefaultEscalationScore[] {
    const out: DefaultEscalationScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultEscalationScoreStore(): DefaultEscalationScoreStore {
  return new MemoryDefaultEscalationScoreStore(new Map<string, DefaultEscalationScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultEscalationScoreStore implements DefaultEscalationScoreStore {
  inner: DefaultEscalationScoreStore;
  cache: cache.TtlCache<DefaultEscalationScore>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultEscalationScoreStore,
    cacheValue: cache.TtlCache<DefaultEscalationScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultEscalationScore | undefined {
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

  save(item: DefaultEscalationScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultEscalationScore[] {
    return this.inner.list();
  }
}

export function newCachedDefaultEscalationScoreStore(inner: DefaultEscalationScoreStore, ttl: number, clockValue: clock.Clock): DefaultEscalationScoreStore {
  return new CachedDefaultEscalationScoreStore(
    inner,
    cache.newTtlCache<DefaultEscalationScore>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default escalation scores. Empty fields match all. */
export class DefaultEscalationScoreQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultEscalationScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultEscalationScore[]): DefaultEscalationScore[] {
    const matched = collections.filter(items, (candidate: DefaultEscalationScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultEscalationScores(store: DefaultEscalationScoreStore, query: DefaultEscalationScoreQuery): DefaultEscalationScore[] {
  return query.apply(store.list());
}
