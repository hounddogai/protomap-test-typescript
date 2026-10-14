import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaMilestone } from "./sla-milestone.js";

/** Keeps sla milestones by code. */
export interface SlaMilestoneStore {
  find(code: string): SlaMilestone | undefined;
  save(item: SlaMilestone): void;
  remove(code: string): boolean;
  list(): SlaMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaMilestoneStore implements SlaMilestoneStore {
  items: Map<string, SlaMilestone>;
  order: string[];

  constructor(items: Map<string, SlaMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaMilestone): void {
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

  list(): SlaMilestone[] {
    const out: SlaMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaMilestoneStore(): SlaMilestoneStore {
  return new MemorySlaMilestoneStore(new Map<string, SlaMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaMilestoneStore implements SlaMilestoneStore {
  inner: SlaMilestoneStore;
  cache: cache.TtlCache<SlaMilestone>;
  hits: number;
  misses: number;

  constructor(inner: SlaMilestoneStore, cacheValue: cache.TtlCache<SlaMilestone>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaMilestone | undefined {
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

  save(item: SlaMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaMilestone[] {
    return this.inner.list();
  }
}

export function newCachedSlaMilestoneStore(inner: SlaMilestoneStore, ttl: number, clockValue: clock.Clock): SlaMilestoneStore {
  return new CachedSlaMilestoneStore(inner, cache.newTtlCache<SlaMilestone>(256, ttl, clockValue), 0, 0);
}

/** Selects sla milestones. Empty fields match all. */
export class SlaMilestoneQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaMilestone[]): SlaMilestone[] {
    const matched = collections.filter(items, (candidate: SlaMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaMilestones(store: SlaMilestoneStore, query: SlaMilestoneQuery): SlaMilestone[] {
  return query.apply(store.list());
}
