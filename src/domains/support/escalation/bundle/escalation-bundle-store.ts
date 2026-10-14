import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationBundle } from "./escalation-bundle.js";

/** Keeps escalation bundles by code. */
export interface EscalationBundleStore {
  find(code: string): EscalationBundle | undefined;
  save(item: EscalationBundle): void;
  remove(code: string): boolean;
  list(): EscalationBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationBundleStore implements EscalationBundleStore {
  items: Map<string, EscalationBundle>;
  order: string[];

  constructor(items: Map<string, EscalationBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationBundle): void {
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

  list(): EscalationBundle[] {
    const out: EscalationBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationBundleStore(): EscalationBundleStore {
  return new MemoryEscalationBundleStore(new Map<string, EscalationBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationBundleStore implements EscalationBundleStore {
  inner: EscalationBundleStore;
  cache: cache.TtlCache<EscalationBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationBundleStore,
    cacheValue: cache.TtlCache<EscalationBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationBundle | undefined {
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

  save(item: EscalationBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationBundle[] {
    return this.inner.list();
  }
}

export function newCachedEscalationBundleStore(inner: EscalationBundleStore, ttl: number, clockValue: clock.Clock): EscalationBundleStore {
  return new CachedEscalationBundleStore(inner, cache.newTtlCache<EscalationBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation bundles. Empty fields match all. */
export class EscalationBundleQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationBundle[]): EscalationBundle[] {
    const matched = collections.filter(items, (candidate: EscalationBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationBundles(store: EscalationBundleStore, query: EscalationBundleQuery): EscalationBundle[] {
  return query.apply(store.list());
}
