import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPostRule } from "./lenient-post-rule.js";

/** Keeps lenient post rules by code. */
export interface LenientPostRuleStore {
  find(code: string): LenientPostRule | undefined;
  save(item: LenientPostRule): void;
  remove(code: string): boolean;
  list(): LenientPostRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPostRuleStore implements LenientPostRuleStore {
  items: Map<string, LenientPostRule>;
  order: string[];

  constructor(items: Map<string, LenientPostRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPostRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPostRule): void {
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

  list(): LenientPostRule[] {
    const out: LenientPostRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPostRuleStore(): LenientPostRuleStore {
  return new MemoryLenientPostRuleStore(new Map<string, LenientPostRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPostRuleStore implements LenientPostRuleStore {
  inner: LenientPostRuleStore;
  cache: cache.TtlCache<LenientPostRule>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPostRuleStore,
    cacheValue: cache.TtlCache<LenientPostRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPostRule | undefined {
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

  save(item: LenientPostRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPostRule[] {
    return this.inner.list();
  }
}

export function newCachedLenientPostRuleStore(inner: LenientPostRuleStore, ttl: number, clockValue: clock.Clock): LenientPostRuleStore {
  return new CachedLenientPostRuleStore(inner, cache.newTtlCache<LenientPostRule>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient post rules. Empty fields match all. */
export class LenientPostRuleQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPostRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPostRule[]): LenientPostRule[] {
    const matched = collections.filter(items, (candidate: LenientPostRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPostRules(store: LenientPostRuleStore, query: LenientPostRuleQuery): LenientPostRule[] {
  return query.apply(store.list());
}
