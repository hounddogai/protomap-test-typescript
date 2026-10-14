import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultExitRuleClaim } from "./default-exit-rule-claim.js";

/** Keeps default exit rule claims by code. */
export interface DefaultExitRuleClaimStore {
  find(code: string): DefaultExitRuleClaim | undefined;
  save(item: DefaultExitRuleClaim): void;
  remove(code: string): boolean;
  list(): DefaultExitRuleClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultExitRuleClaimStore implements DefaultExitRuleClaimStore {
  items: Map<string, DefaultExitRuleClaim>;
  order: string[];

  constructor(items: Map<string, DefaultExitRuleClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultExitRuleClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultExitRuleClaim): void {
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

  list(): DefaultExitRuleClaim[] {
    const out: DefaultExitRuleClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultExitRuleClaimStore(): DefaultExitRuleClaimStore {
  return new MemoryDefaultExitRuleClaimStore(new Map<string, DefaultExitRuleClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultExitRuleClaimStore implements DefaultExitRuleClaimStore {
  inner: DefaultExitRuleClaimStore;
  cache: cache.TtlCache<DefaultExitRuleClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultExitRuleClaimStore,
    cacheValue: cache.TtlCache<DefaultExitRuleClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultExitRuleClaim | undefined {
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

  save(item: DefaultExitRuleClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultExitRuleClaim[] {
    return this.inner.list();
  }
}

export function newCachedDefaultExitRuleClaimStore(inner: DefaultExitRuleClaimStore, ttl: number, clockValue: clock.Clock): DefaultExitRuleClaimStore {
  return new CachedDefaultExitRuleClaimStore(
    inner,
    cache.newTtlCache<DefaultExitRuleClaim>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default exit rule claims. Empty fields match all. */
export class DefaultExitRuleClaimQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultExitRuleClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultExitRuleClaim[]): DefaultExitRuleClaim[] {
    const matched = collections.filter(items, (candidate: DefaultExitRuleClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultExitRuleClaims(store: DefaultExitRuleClaimStore, query: DefaultExitRuleClaimQuery): DefaultExitRuleClaim[] {
  return query.apply(store.list());
}
