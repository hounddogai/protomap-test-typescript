import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferencePolicy } from "./preference-policy.js";

/** Keeps preference policies by code. */
export interface PreferencePolicyStore {
  find(code: string): PreferencePolicy | undefined;
  save(item: PreferencePolicy): void;
  remove(code: string): boolean;
  list(): PreferencePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferencePolicyStore implements PreferencePolicyStore {
  items: Map<string, PreferencePolicy>;
  order: string[];

  constructor(items: Map<string, PreferencePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferencePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferencePolicy): void {
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

  list(): PreferencePolicy[] {
    const out: PreferencePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferencePolicyStore(): PreferencePolicyStore {
  return new MemoryPreferencePolicyStore(new Map<string, PreferencePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferencePolicyStore implements PreferencePolicyStore {
  inner: PreferencePolicyStore;
  cache: cache.TtlCache<PreferencePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferencePolicyStore,
    cacheValue: cache.TtlCache<PreferencePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferencePolicy | undefined {
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

  save(item: PreferencePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferencePolicy[] {
    return this.inner.list();
  }
}

export function newCachedPreferencePolicyStore(inner: PreferencePolicyStore, ttl: number, clockValue: clock.Clock): PreferencePolicyStore {
  return new CachedPreferencePolicyStore(inner, cache.newTtlCache<PreferencePolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects preference policies. Empty fields match all. */
export class PreferencePolicyQuery {
  channel: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAttempts: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferencePolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferencePolicy[]): PreferencePolicy[] {
    const matched = collections.filter(items, (candidate: PreferencePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferencePolicies(store: PreferencePolicyStore, query: PreferencePolicyQuery): PreferencePolicy[] {
  return query.apply(store.list());
}
