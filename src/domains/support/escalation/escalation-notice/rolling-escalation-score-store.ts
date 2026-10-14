import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingEscalationScore } from "./rolling-escalation-score.js";

/** Keeps rolling escalation scores by code. */
export interface RollingEscalationScoreStore {
  find(code: string): RollingEscalationScore | undefined;
  save(item: RollingEscalationScore): void;
  remove(code: string): boolean;
  list(): RollingEscalationScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingEscalationScoreStore implements RollingEscalationScoreStore {
  items: Map<string, RollingEscalationScore>;
  order: string[];

  constructor(items: Map<string, RollingEscalationScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingEscalationScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingEscalationScore): void {
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

  list(): RollingEscalationScore[] {
    const out: RollingEscalationScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingEscalationScoreStore(): RollingEscalationScoreStore {
  return new MemoryRollingEscalationScoreStore(new Map<string, RollingEscalationScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingEscalationScoreStore implements RollingEscalationScoreStore {
  inner: RollingEscalationScoreStore;
  cache: cache.TtlCache<RollingEscalationScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingEscalationScoreStore,
    cacheValue: cache.TtlCache<RollingEscalationScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingEscalationScore | undefined {
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

  save(item: RollingEscalationScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingEscalationScore[] {
    return this.inner.list();
  }
}

export function newCachedRollingEscalationScoreStore(inner: RollingEscalationScoreStore, ttl: number, clockValue: clock.Clock): RollingEscalationScoreStore {
  return new CachedRollingEscalationScoreStore(
    inner,
    cache.newTtlCache<RollingEscalationScore>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling escalation scores. Empty fields match all. */
export class RollingEscalationScoreQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingEscalationScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingEscalationScore[]): RollingEscalationScore[] {
    const matched = collections.filter(items, (candidate: RollingEscalationScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingEscalationScores(store: RollingEscalationScoreStore, query: RollingEscalationScoreQuery): RollingEscalationScore[] {
  return query.apply(store.list());
}
