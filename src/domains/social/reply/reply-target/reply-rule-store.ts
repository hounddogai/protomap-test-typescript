import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyRule } from "./reply-rule.js";

/** Keeps reply rules by code. */
export interface ReplyRuleStore {
  find(code: string): ReplyRule | undefined;
  save(item: ReplyRule): void;
  remove(code: string): boolean;
  list(): ReplyRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyRuleStore implements ReplyRuleStore {
  items: Map<string, ReplyRule>;
  order: string[];

  constructor(items: Map<string, ReplyRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyRule): void {
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

  list(): ReplyRule[] {
    const out: ReplyRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyRuleStore(): ReplyRuleStore {
  return new MemoryReplyRuleStore(new Map<string, ReplyRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyRuleStore implements ReplyRuleStore {
  inner: ReplyRuleStore;
  cache: cache.TtlCache<ReplyRule>;
  hits: number;
  misses: number;

  constructor(inner: ReplyRuleStore, cacheValue: cache.TtlCache<ReplyRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyRule | undefined {
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

  save(item: ReplyRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyRule[] {
    return this.inner.list();
  }
}

export function newCachedReplyRuleStore(inner: ReplyRuleStore, ttl: number, clockValue: clock.Clock): ReplyRuleStore {
  return new CachedReplyRuleStore(inner, cache.newTtlCache<ReplyRule>(512, ttl, clockValue), 0, 0);
}

/** Selects reply rules. Empty fields match all. */
export class ReplyRuleQuery {
  segment: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyRule): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyRule[]): ReplyRule[] {
    const matched = collections.filter(items, (candidate: ReplyRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyRules(store: ReplyRuleStore, query: ReplyRuleQuery): ReplyRule[] {
  return query.apply(store.list());
}
