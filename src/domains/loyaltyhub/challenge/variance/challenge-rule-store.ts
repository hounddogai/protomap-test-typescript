import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeRule } from "./challenge-rule.js";

/** Keeps challenge rules by code. */
export interface ChallengeRuleStore {
  find(code: string): ChallengeRule | undefined;
  save(item: ChallengeRule): void;
  remove(code: string): boolean;
  list(): ChallengeRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeRuleStore implements ChallengeRuleStore {
  items: Map<string, ChallengeRule>;
  order: string[];

  constructor(items: Map<string, ChallengeRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeRule): void {
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

  list(): ChallengeRule[] {
    const out: ChallengeRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeRuleStore(): ChallengeRuleStore {
  return new MemoryChallengeRuleStore(new Map<string, ChallengeRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeRuleStore implements ChallengeRuleStore {
  inner: ChallengeRuleStore;
  cache: cache.TtlCache<ChallengeRule>;
  hits: number;
  misses: number;

  constructor(inner: ChallengeRuleStore, cacheValue: cache.TtlCache<ChallengeRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeRule | undefined {
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

  save(item: ChallengeRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeRule[] {
    return this.inner.list();
  }
}

export function newCachedChallengeRuleStore(inner: ChallengeRuleStore, ttl: number, clockValue: clock.Clock): ChallengeRuleStore {
  return new CachedChallengeRuleStore(inner, cache.newTtlCache<ChallengeRule>(64, ttl, clockValue), 0, 0);
}

/** Selects challenge rules. Empty fields match all. */
export class ChallengeRuleQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeRule[]): ChallengeRule[] {
    const matched = collections.filter(items, (candidate: ChallengeRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeRules(store: ChallengeRuleStore, query: ChallengeRuleQuery): ChallengeRule[] {
  return query.apply(store.list());
}
