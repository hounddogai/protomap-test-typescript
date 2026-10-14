import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceTarget } from "./preference-target.js";

/** Keeps preference targets by code. */
export interface PreferenceTargetStore {
  find(code: string): PreferenceTarget | undefined;
  save(item: PreferenceTarget): void;
  remove(code: string): boolean;
  list(): PreferenceTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceTargetStore implements PreferenceTargetStore {
  items: Map<string, PreferenceTarget>;
  order: string[];

  constructor(items: Map<string, PreferenceTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceTarget): void {
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

  list(): PreferenceTarget[] {
    const out: PreferenceTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceTargetStore(): PreferenceTargetStore {
  return new MemoryPreferenceTargetStore(new Map<string, PreferenceTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceTargetStore implements PreferenceTargetStore {
  inner: PreferenceTargetStore;
  cache: cache.TtlCache<PreferenceTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceTargetStore,
    cacheValue: cache.TtlCache<PreferenceTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceTarget | undefined {
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

  save(item: PreferenceTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceTarget[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceTargetStore(inner: PreferenceTargetStore, ttl: number, clockValue: clock.Clock): PreferenceTargetStore {
  return new CachedPreferenceTargetStore(inner, cache.newTtlCache<PreferenceTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects preference targets. Empty fields match all. */
export class PreferenceTargetQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceTarget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceTarget[]): PreferenceTarget[] {
    const matched = collections.filter(items, (candidate: PreferenceTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceTargets(store: PreferenceTargetStore, query: PreferenceTargetQuery): PreferenceTarget[] {
  return query.apply(store.list());
}
