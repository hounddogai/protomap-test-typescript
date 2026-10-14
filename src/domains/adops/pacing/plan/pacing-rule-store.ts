import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingRule } from "./pacing-rule.js";

/** Keeps pacing rules by code. */
export interface PacingRuleStore {
  find(code: string): PacingRule | undefined;
  save(item: PacingRule): void;
  remove(code: string): boolean;
  list(): PacingRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingRuleStore implements PacingRuleStore {
  items: Map<string, PacingRule>;
  order: string[];

  constructor(items: Map<string, PacingRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingRule): void {
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

  list(): PacingRule[] {
    const out: PacingRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingRuleStore(): PacingRuleStore {
  return new MemoryPacingRuleStore(new Map<string, PacingRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingRuleStore implements PacingRuleStore {
  inner: PacingRuleStore;
  cache: cache.TtlCache<PacingRule>;
  hits: number;
  misses: number;

  constructor(inner: PacingRuleStore, cacheValue: cache.TtlCache<PacingRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingRule | undefined {
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

  save(item: PacingRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingRule[] {
    return this.inner.list();
  }
}

export function newCachedPacingRuleStore(inner: PacingRuleStore, ttl: number, clockValue: clock.Clock): PacingRuleStore {
  return new CachedPacingRuleStore(inner, cache.newTtlCache<PacingRule>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing rules. Empty fields match all. */
export class PacingRuleQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingRule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingRule[]): PacingRule[] {
    const matched = collections.filter(items, (candidate: PacingRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingRules(store: PacingRuleStore, query: PacingRuleQuery): PacingRule[] {
  return query.apply(store.list());
}
