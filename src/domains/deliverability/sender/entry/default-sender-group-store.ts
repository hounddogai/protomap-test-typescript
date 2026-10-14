import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSenderGroup } from "./default-sender-group.js";

/** Keeps default sender groups by code. */
export interface DefaultSenderGroupStore {
  find(code: string): DefaultSenderGroup | undefined;
  save(item: DefaultSenderGroup): void;
  remove(code: string): boolean;
  list(): DefaultSenderGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSenderGroupStore implements DefaultSenderGroupStore {
  items: Map<string, DefaultSenderGroup>;
  order: string[];

  constructor(items: Map<string, DefaultSenderGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSenderGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSenderGroup): void {
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

  list(): DefaultSenderGroup[] {
    const out: DefaultSenderGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSenderGroupStore(): DefaultSenderGroupStore {
  return new MemoryDefaultSenderGroupStore(new Map<string, DefaultSenderGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSenderGroupStore implements DefaultSenderGroupStore {
  inner: DefaultSenderGroupStore;
  cache: cache.TtlCache<DefaultSenderGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSenderGroupStore,
    cacheValue: cache.TtlCache<DefaultSenderGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSenderGroup | undefined {
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

  save(item: DefaultSenderGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSenderGroup[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSenderGroupStore(inner: DefaultSenderGroupStore, ttl: number, clockValue: clock.Clock): DefaultSenderGroupStore {
  return new CachedDefaultSenderGroupStore(inner, cache.newTtlCache<DefaultSenderGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects default sender groups. Empty fields match all. */
export class DefaultSenderGroupQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSenderGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSenderGroup[]): DefaultSenderGroup[] {
    const matched = collections.filter(items, (candidate: DefaultSenderGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSenderGroups(store: DefaultSenderGroupStore, query: DefaultSenderGroupQuery): DefaultSenderGroup[] {
  return query.apply(store.list());
}
