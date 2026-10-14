import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSenderRule } from "./default-sender-rule.js";

/** Keeps default sender rules by code. */
export interface DefaultSenderRuleStore {
  find(code: string): DefaultSenderRule | undefined;
  save(item: DefaultSenderRule): void;
  remove(code: string): boolean;
  list(): DefaultSenderRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSenderRuleStore implements DefaultSenderRuleStore {
  items: Map<string, DefaultSenderRule>;
  order: string[];

  constructor(items: Map<string, DefaultSenderRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSenderRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSenderRule): void {
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

  list(): DefaultSenderRule[] {
    const out: DefaultSenderRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSenderRuleStore(): DefaultSenderRuleStore {
  return new MemoryDefaultSenderRuleStore(new Map<string, DefaultSenderRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSenderRuleStore implements DefaultSenderRuleStore {
  inner: DefaultSenderRuleStore;
  cache: cache.TtlCache<DefaultSenderRule>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSenderRuleStore,
    cacheValue: cache.TtlCache<DefaultSenderRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSenderRule | undefined {
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

  save(item: DefaultSenderRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSenderRule[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSenderRuleStore(inner: DefaultSenderRuleStore, ttl: number, clockValue: clock.Clock): DefaultSenderRuleStore {
  return new CachedDefaultSenderRuleStore(inner, cache.newTtlCache<DefaultSenderRule>(128, ttl, clockValue), 0, 0);
}

/** Selects default sender rules. Empty fields match all. */
export class DefaultSenderRuleQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSenderRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSenderRule[]): DefaultSenderRule[] {
    const matched = collections.filter(items, (candidate: DefaultSenderRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSenderRules(store: DefaultSenderRuleStore, query: DefaultSenderRuleQuery): DefaultSenderRule[] {
  return query.apply(store.list());
}
