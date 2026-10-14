import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeMilestone } from "./creative-milestone.js";

/** Keeps creative milestones by code. */
export interface CreativeMilestoneStore {
  find(code: string): CreativeMilestone | undefined;
  save(item: CreativeMilestone): void;
  remove(code: string): boolean;
  list(): CreativeMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeMilestoneStore implements CreativeMilestoneStore {
  items: Map<string, CreativeMilestone>;
  order: string[];

  constructor(items: Map<string, CreativeMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeMilestone): void {
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

  list(): CreativeMilestone[] {
    const out: CreativeMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeMilestoneStore(): CreativeMilestoneStore {
  return new MemoryCreativeMilestoneStore(new Map<string, CreativeMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeMilestoneStore implements CreativeMilestoneStore {
  inner: CreativeMilestoneStore;
  cache: cache.TtlCache<CreativeMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeMilestoneStore,
    cacheValue: cache.TtlCache<CreativeMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeMilestone | undefined {
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

  save(item: CreativeMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeMilestone[] {
    return this.inner.list();
  }
}

export function newCachedCreativeMilestoneStore(inner: CreativeMilestoneStore, ttl: number, clockValue: clock.Clock): CreativeMilestoneStore {
  return new CachedCreativeMilestoneStore(inner, cache.newTtlCache<CreativeMilestone>(64, ttl, clockValue), 0, 0);
}

/** Selects creative milestones. Empty fields match all. */
export class CreativeMilestoneQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeMilestone[]): CreativeMilestone[] {
    const matched = collections.filter(items, (candidate: CreativeMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeMilestones(store: CreativeMilestoneStore, query: CreativeMilestoneQuery): CreativeMilestone[] {
  return query.apply(store.list());
}
