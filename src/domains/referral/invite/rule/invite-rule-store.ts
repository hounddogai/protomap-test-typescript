import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteRule } from "./invite-rule.js";

/** Keeps invite rules by code. */
export interface InviteRuleStore {
  find(code: string): InviteRule | undefined;
  save(item: InviteRule): void;
  remove(code: string): boolean;
  list(): InviteRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteRuleStore implements InviteRuleStore {
  items: Map<string, InviteRule>;
  order: string[];

  constructor(items: Map<string, InviteRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteRule): void {
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

  list(): InviteRule[] {
    const out: InviteRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteRuleStore(): InviteRuleStore {
  return new MemoryInviteRuleStore(new Map<string, InviteRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteRuleStore implements InviteRuleStore {
  inner: InviteRuleStore;
  cache: cache.TtlCache<InviteRule>;
  hits: number;
  misses: number;

  constructor(inner: InviteRuleStore, cacheValue: cache.TtlCache<InviteRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteRule | undefined {
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

  save(item: InviteRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteRule[] {
    return this.inner.list();
  }
}

export function newCachedInviteRuleStore(inner: InviteRuleStore, ttl: number, clockValue: clock.Clock): InviteRuleStore {
  return new CachedInviteRuleStore(inner, cache.newTtlCache<InviteRule>(128, ttl, clockValue), 0, 0);
}

/** Selects invite rules. Empty fields match all. */
export class InviteRuleQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteRule[]): InviteRule[] {
    const matched = collections.filter(items, (candidate: InviteRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteRules(store: InviteRuleStore, query: InviteRuleQuery): InviteRule[] {
  return query.apply(store.list());
}
