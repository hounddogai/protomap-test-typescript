import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowOverride } from "./window-override.js";

/** Keeps window overrides by code. */
export interface WindowOverrideStore {
  find(code: string): WindowOverride | undefined;
  save(item: WindowOverride): void;
  remove(code: string): boolean;
  list(): WindowOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowOverrideStore implements WindowOverrideStore {
  items: Map<string, WindowOverride>;
  order: string[];

  constructor(items: Map<string, WindowOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowOverride): void {
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

  list(): WindowOverride[] {
    const out: WindowOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowOverrideStore(): WindowOverrideStore {
  return new MemoryWindowOverrideStore(new Map<string, WindowOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowOverrideStore implements WindowOverrideStore {
  inner: WindowOverrideStore;
  cache: cache.TtlCache<WindowOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowOverrideStore,
    cacheValue: cache.TtlCache<WindowOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowOverride | undefined {
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

  save(item: WindowOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowOverride[] {
    return this.inner.list();
  }
}

export function newCachedWindowOverrideStore(inner: WindowOverrideStore, ttl: number, clockValue: clock.Clock): WindowOverrideStore {
  return new CachedWindowOverrideStore(inner, cache.newTtlCache<WindowOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects window overrides. Empty fields match all. */
export class WindowOverrideQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowOverride): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowOverride[]): WindowOverride[] {
    const matched = collections.filter(items, (candidate: WindowOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowOverrides(store: WindowOverrideStore, query: WindowOverrideQuery): WindowOverride[] {
  return query.apply(store.list());
}
