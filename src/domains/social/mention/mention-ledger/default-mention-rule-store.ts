import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultMentionRule } from "./default-mention-rule.js";

/** Keeps default mention rules by code. */
export interface DefaultMentionRuleStore {
  find(code: string): DefaultMentionRule | undefined;
  save(item: DefaultMentionRule): void;
  remove(code: string): boolean;
  list(): DefaultMentionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultMentionRuleStore implements DefaultMentionRuleStore {
  items: Map<string, DefaultMentionRule>;
  order: string[];

  constructor(items: Map<string, DefaultMentionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultMentionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultMentionRule): void {
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

  list(): DefaultMentionRule[] {
    const out: DefaultMentionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultMentionRuleStore(): DefaultMentionRuleStore {
  return new MemoryDefaultMentionRuleStore(new Map<string, DefaultMentionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultMentionRuleStore implements DefaultMentionRuleStore {
  inner: DefaultMentionRuleStore;
  cache: cache.TtlCache<DefaultMentionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultMentionRuleStore,
    cacheValue: cache.TtlCache<DefaultMentionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultMentionRule | undefined {
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

  save(item: DefaultMentionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultMentionRule[] {
    return this.inner.list();
  }
}

export function newCachedDefaultMentionRuleStore(inner: DefaultMentionRuleStore, ttl: number, clockValue: clock.Clock): DefaultMentionRuleStore {
  return new CachedDefaultMentionRuleStore(inner, cache.newTtlCache<DefaultMentionRule>(128, ttl, clockValue), 0, 0);
}

/** Selects default mention rules. Empty fields match all. */
export class DefaultMentionRuleQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultMentionRule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultMentionRule[]): DefaultMentionRule[] {
    const matched = collections.filter(items, (candidate: DefaultMentionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultMentionRules(store: DefaultMentionRuleStore, query: DefaultMentionRuleQuery): DefaultMentionRule[] {
  return query.apply(store.list());
}
