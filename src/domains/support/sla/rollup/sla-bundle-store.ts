import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaBundle } from "./sla-bundle.js";

/** Keeps sla bundles by code. */
export interface SlaBundleStore {
  find(code: string): SlaBundle | undefined;
  save(item: SlaBundle): void;
  remove(code: string): boolean;
  list(): SlaBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaBundleStore implements SlaBundleStore {
  items: Map<string, SlaBundle>;
  order: string[];

  constructor(items: Map<string, SlaBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaBundle): void {
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

  list(): SlaBundle[] {
    const out: SlaBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaBundleStore(): SlaBundleStore {
  return new MemorySlaBundleStore(new Map<string, SlaBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaBundleStore implements SlaBundleStore {
  inner: SlaBundleStore;
  cache: cache.TtlCache<SlaBundle>;
  hits: number;
  misses: number;

  constructor(inner: SlaBundleStore, cacheValue: cache.TtlCache<SlaBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaBundle | undefined {
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

  save(item: SlaBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaBundle[] {
    return this.inner.list();
  }
}

export function newCachedSlaBundleStore(inner: SlaBundleStore, ttl: number, clockValue: clock.Clock): SlaBundleStore {
  return new CachedSlaBundleStore(inner, cache.newTtlCache<SlaBundle>(256, ttl, clockValue), 0, 0);
}

/** Selects sla bundles. Empty fields match all. */
export class SlaBundleQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaBundle[]): SlaBundle[] {
    const matched = collections.filter(items, (candidate: SlaBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaBundles(store: SlaBundleStore, query: SlaBundleQuery): SlaBundle[] {
  return query.apply(store.list());
}
