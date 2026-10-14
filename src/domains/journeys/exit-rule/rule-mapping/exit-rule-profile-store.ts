import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleProfile } from "./exit-rule-profile.js";

/** Keeps exit rule profiles by code. */
export interface ExitRuleProfileStore {
  find(code: string): ExitRuleProfile | undefined;
  save(item: ExitRuleProfile): void;
  remove(code: string): boolean;
  list(): ExitRuleProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleProfileStore implements ExitRuleProfileStore {
  items: Map<string, ExitRuleProfile>;
  order: string[];

  constructor(items: Map<string, ExitRuleProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleProfile): void {
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

  list(): ExitRuleProfile[] {
    const out: ExitRuleProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleProfileStore(): ExitRuleProfileStore {
  return new MemoryExitRuleProfileStore(new Map<string, ExitRuleProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleProfileStore implements ExitRuleProfileStore {
  inner: ExitRuleProfileStore;
  cache: cache.TtlCache<ExitRuleProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleProfileStore,
    cacheValue: cache.TtlCache<ExitRuleProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleProfile | undefined {
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

  save(item: ExitRuleProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleProfile[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleProfileStore(inner: ExitRuleProfileStore, ttl: number, clockValue: clock.Clock): ExitRuleProfileStore {
  return new CachedExitRuleProfileStore(inner, cache.newTtlCache<ExitRuleProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects exit rule profiles. Empty fields match all. */
export class ExitRuleProfileQuery {
  segment: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMinimum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleProfile): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleProfile[]): ExitRuleProfile[] {
    const matched = collections.filter(items, (candidate: ExitRuleProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleProfiles(store: ExitRuleProfileStore, query: ExitRuleProfileQuery): ExitRuleProfile[] {
  return query.apply(store.list());
}
