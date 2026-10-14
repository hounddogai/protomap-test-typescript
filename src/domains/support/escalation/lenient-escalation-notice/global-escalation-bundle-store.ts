import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalEscalationBundle } from "./global-escalation-bundle.js";

/** Keeps global escalation bundles by code. */
export interface GlobalEscalationBundleStore {
  find(code: string): GlobalEscalationBundle | undefined;
  save(item: GlobalEscalationBundle): void;
  remove(code: string): boolean;
  list(): GlobalEscalationBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalEscalationBundleStore implements GlobalEscalationBundleStore {
  items: Map<string, GlobalEscalationBundle>;
  order: string[];

  constructor(items: Map<string, GlobalEscalationBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalEscalationBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalEscalationBundle): void {
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

  list(): GlobalEscalationBundle[] {
    const out: GlobalEscalationBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalEscalationBundleStore(): GlobalEscalationBundleStore {
  return new MemoryGlobalEscalationBundleStore(new Map<string, GlobalEscalationBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalEscalationBundleStore implements GlobalEscalationBundleStore {
  inner: GlobalEscalationBundleStore;
  cache: cache.TtlCache<GlobalEscalationBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalEscalationBundleStore,
    cacheValue: cache.TtlCache<GlobalEscalationBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalEscalationBundle | undefined {
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

  save(item: GlobalEscalationBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalEscalationBundle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalEscalationBundleStore(inner: GlobalEscalationBundleStore, ttl: number, clockValue: clock.Clock): GlobalEscalationBundleStore {
  return new CachedGlobalEscalationBundleStore(
    inner,
    cache.newTtlCache<GlobalEscalationBundle>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global escalation bundles. Empty fields match all. */
export class GlobalEscalationBundleQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalEscalationBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalEscalationBundle[]): GlobalEscalationBundle[] {
    const matched = collections.filter(items, (candidate: GlobalEscalationBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalEscalationBundles(store: GlobalEscalationBundleStore, query: GlobalEscalationBundleQuery): GlobalEscalationBundle[] {
  return query.apply(store.list());
}
