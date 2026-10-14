import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWaitRule } from "./rolling-wait-rule.js";

/** Keeps rolling wait rules by code. */
export interface RollingWaitRuleStore {
  find(code: string): RollingWaitRule | undefined;
  save(item: RollingWaitRule): void;
  remove(code: string): boolean;
  list(): RollingWaitRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWaitRuleStore implements RollingWaitRuleStore {
  items: Map<string, RollingWaitRule>;
  order: string[];

  constructor(items: Map<string, RollingWaitRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWaitRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWaitRule): void {
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

  list(): RollingWaitRule[] {
    const out: RollingWaitRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWaitRuleStore(): RollingWaitRuleStore {
  return new MemoryRollingWaitRuleStore(new Map<string, RollingWaitRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWaitRuleStore implements RollingWaitRuleStore {
  inner: RollingWaitRuleStore;
  cache: cache.TtlCache<RollingWaitRule>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWaitRuleStore,
    cacheValue: cache.TtlCache<RollingWaitRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWaitRule | undefined {
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

  save(item: RollingWaitRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWaitRule[] {
    return this.inner.list();
  }
}

export function newCachedRollingWaitRuleStore(inner: RollingWaitRuleStore, ttl: number, clockValue: clock.Clock): RollingWaitRuleStore {
  return new CachedRollingWaitRuleStore(inner, cache.newTtlCache<RollingWaitRule>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling wait rules. Empty fields match all. */
export class RollingWaitRuleQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWaitRule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWaitRule[]): RollingWaitRule[] {
    const matched = collections.filter(items, (candidate: RollingWaitRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWaitRules(store: RollingWaitRuleStore, query: RollingWaitRuleQuery): RollingWaitRule[] {
  return query.apply(store.list());
}
