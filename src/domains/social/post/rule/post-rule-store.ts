import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostRule } from "./post-rule.js";

/** Keeps post rules by code. */
export interface PostRuleStore {
  find(code: string): PostRule | undefined;
  save(item: PostRule): void;
  remove(code: string): boolean;
  list(): PostRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostRuleStore implements PostRuleStore {
  items: Map<string, PostRule>;
  order: string[];

  constructor(items: Map<string, PostRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostRule): void {
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

  list(): PostRule[] {
    const out: PostRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostRuleStore(): PostRuleStore {
  return new MemoryPostRuleStore(new Map<string, PostRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostRuleStore implements PostRuleStore {
  inner: PostRuleStore;
  cache: cache.TtlCache<PostRule>;
  hits: number;
  misses: number;

  constructor(inner: PostRuleStore, cacheValue: cache.TtlCache<PostRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostRule | undefined {
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

  save(item: PostRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostRule[] {
    return this.inner.list();
  }
}

export function newCachedPostRuleStore(inner: PostRuleStore, ttl: number, clockValue: clock.Clock): PostRuleStore {
  return new CachedPostRuleStore(inner, cache.newTtlCache<PostRule>(128, ttl, clockValue), 0, 0);
}

/** Selects post rules. Empty fields match all. */
export class PostRuleQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostRule[]): PostRule[] {
    const matched = collections.filter(items, (candidate: PostRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostRules(store: PostRuleStore, query: PostRuleQuery): PostRule[] {
  return query.apply(store.list());
}
