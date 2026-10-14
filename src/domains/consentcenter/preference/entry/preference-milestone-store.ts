import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceMilestone } from "./preference-milestone.js";

/** Keeps preference milestones by code. */
export interface PreferenceMilestoneStore {
  find(code: string): PreferenceMilestone | undefined;
  save(item: PreferenceMilestone): void;
  remove(code: string): boolean;
  list(): PreferenceMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceMilestoneStore implements PreferenceMilestoneStore {
  items: Map<string, PreferenceMilestone>;
  order: string[];

  constructor(items: Map<string, PreferenceMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceMilestone): void {
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

  list(): PreferenceMilestone[] {
    const out: PreferenceMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceMilestoneStore(): PreferenceMilestoneStore {
  return new MemoryPreferenceMilestoneStore(new Map<string, PreferenceMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceMilestoneStore implements PreferenceMilestoneStore {
  inner: PreferenceMilestoneStore;
  cache: cache.TtlCache<PreferenceMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceMilestoneStore,
    cacheValue: cache.TtlCache<PreferenceMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceMilestone | undefined {
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

  save(item: PreferenceMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceMilestone[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceMilestoneStore(inner: PreferenceMilestoneStore, ttl: number, clockValue: clock.Clock): PreferenceMilestoneStore {
  return new CachedPreferenceMilestoneStore(inner, cache.newTtlCache<PreferenceMilestone>(128, ttl, clockValue), 0, 0);
}

/** Selects preference milestones. Empty fields match all. */
export class PreferenceMilestoneQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceMilestone[]): PreferenceMilestone[] {
    const matched = collections.filter(items, (candidate: PreferenceMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceMilestones(store: PreferenceMilestoneStore, query: PreferenceMilestoneQuery): PreferenceMilestone[] {
  return query.apply(store.list());
}
