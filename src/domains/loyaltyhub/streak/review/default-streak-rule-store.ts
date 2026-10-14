import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultStreakRule } from "./default-streak-rule.js";

/** Keeps default streak rules by code. */
export interface DefaultStreakRuleStore {
  find(code: string): DefaultStreakRule | undefined;
  save(item: DefaultStreakRule): void;
  remove(code: string): boolean;
  list(): DefaultStreakRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultStreakRuleStore implements DefaultStreakRuleStore {
  items: Map<string, DefaultStreakRule>;
  order: string[];

  constructor(items: Map<string, DefaultStreakRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultStreakRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultStreakRule): void {
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

  list(): DefaultStreakRule[] {
    const out: DefaultStreakRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultStreakRuleStore(): DefaultStreakRuleStore {
  return new MemoryDefaultStreakRuleStore(new Map<string, DefaultStreakRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultStreakRuleStore implements DefaultStreakRuleStore {
  inner: DefaultStreakRuleStore;
  cache: cache.TtlCache<DefaultStreakRule>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultStreakRuleStore,
    cacheValue: cache.TtlCache<DefaultStreakRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultStreakRule | undefined {
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

  save(item: DefaultStreakRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultStreakRule[] {
    return this.inner.list();
  }
}

export function newCachedDefaultStreakRuleStore(inner: DefaultStreakRuleStore, ttl: number, clockValue: clock.Clock): DefaultStreakRuleStore {
  return new CachedDefaultStreakRuleStore(inner, cache.newTtlCache<DefaultStreakRule>(1024, ttl, clockValue), 0, 0);
}

/** Selects default streak rules. Empty fields match all. */
export class DefaultStreakRuleQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultStreakRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultStreakRule[]): DefaultStreakRule[] {
    const matched = collections.filter(items, (candidate: DefaultStreakRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultStreakRules(store: DefaultStreakRuleStore, query: DefaultStreakRuleQuery): DefaultStreakRule[] {
  return query.apply(store.list());
}
