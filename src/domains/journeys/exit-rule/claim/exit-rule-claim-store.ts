import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleClaim } from "./exit-rule-claim.js";

/** Keeps exit rule claims by code. */
export interface ExitRuleClaimStore {
  find(code: string): ExitRuleClaim | undefined;
  save(item: ExitRuleClaim): void;
  remove(code: string): boolean;
  list(): ExitRuleClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleClaimStore implements ExitRuleClaimStore {
  items: Map<string, ExitRuleClaim>;
  order: string[];

  constructor(items: Map<string, ExitRuleClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleClaim): void {
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

  list(): ExitRuleClaim[] {
    const out: ExitRuleClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleClaimStore(): ExitRuleClaimStore {
  return new MemoryExitRuleClaimStore(new Map<string, ExitRuleClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleClaimStore implements ExitRuleClaimStore {
  inner: ExitRuleClaimStore;
  cache: cache.TtlCache<ExitRuleClaim>;
  hits: number;
  misses: number;

  constructor(inner: ExitRuleClaimStore, cacheValue: cache.TtlCache<ExitRuleClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleClaim | undefined {
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

  save(item: ExitRuleClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleClaim[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleClaimStore(inner: ExitRuleClaimStore, ttl: number, clockValue: clock.Clock): ExitRuleClaimStore {
  return new CachedExitRuleClaimStore(inner, cache.newTtlCache<ExitRuleClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects exit rule claims. Empty fields match all. */
export class ExitRuleClaimQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleClaim[]): ExitRuleClaim[] {
    const matched = collections.filter(items, (candidate: ExitRuleClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleClaims(store: ExitRuleClaimStore, query: ExitRuleClaimQuery): ExitRuleClaim[] {
  return query.apply(store.list());
}
