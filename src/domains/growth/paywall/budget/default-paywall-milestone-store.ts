import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPaywallMilestone } from "./default-paywall-milestone.js";

/** Keeps default paywall milestones by code. */
export interface DefaultPaywallMilestoneStore {
  find(code: string): DefaultPaywallMilestone | undefined;
  save(item: DefaultPaywallMilestone): void;
  remove(code: string): boolean;
  list(): DefaultPaywallMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPaywallMilestoneStore implements DefaultPaywallMilestoneStore {
  items: Map<string, DefaultPaywallMilestone>;
  order: string[];

  constructor(items: Map<string, DefaultPaywallMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPaywallMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPaywallMilestone): void {
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

  list(): DefaultPaywallMilestone[] {
    const out: DefaultPaywallMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPaywallMilestoneStore(): DefaultPaywallMilestoneStore {
  return new MemoryDefaultPaywallMilestoneStore(new Map<string, DefaultPaywallMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPaywallMilestoneStore implements DefaultPaywallMilestoneStore {
  inner: DefaultPaywallMilestoneStore;
  cache: cache.TtlCache<DefaultPaywallMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPaywallMilestoneStore,
    cacheValue: cache.TtlCache<DefaultPaywallMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPaywallMilestone | undefined {
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

  save(item: DefaultPaywallMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPaywallMilestone[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPaywallMilestoneStore(inner: DefaultPaywallMilestoneStore, ttl: number, clockValue: clock.Clock): DefaultPaywallMilestoneStore {
  return new CachedDefaultPaywallMilestoneStore(
    inner,
    cache.newTtlCache<DefaultPaywallMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default paywall milestones. Empty fields match all. */
export class DefaultPaywallMilestoneQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPaywallMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPaywallMilestone[]): DefaultPaywallMilestone[] {
    const matched = collections.filter(items, (candidate: DefaultPaywallMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPaywallMilestones(store: DefaultPaywallMilestoneStore, query: DefaultPaywallMilestoneQuery): DefaultPaywallMilestone[] {
  return query.apply(store.list());
}
