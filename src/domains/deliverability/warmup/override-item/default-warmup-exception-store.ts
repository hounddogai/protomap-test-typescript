import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWarmupException } from "./default-warmup-exception.js";

/** Keeps default warmup exceptions by code. */
export interface DefaultWarmupExceptionStore {
  find(code: string): DefaultWarmupException | undefined;
  save(item: DefaultWarmupException): void;
  remove(code: string): boolean;
  list(): DefaultWarmupException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWarmupExceptionStore implements DefaultWarmupExceptionStore {
  items: Map<string, DefaultWarmupException>;
  order: string[];

  constructor(items: Map<string, DefaultWarmupException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWarmupException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWarmupException): void {
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

  list(): DefaultWarmupException[] {
    const out: DefaultWarmupException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWarmupExceptionStore(): DefaultWarmupExceptionStore {
  return new MemoryDefaultWarmupExceptionStore(new Map<string, DefaultWarmupException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWarmupExceptionStore implements DefaultWarmupExceptionStore {
  inner: DefaultWarmupExceptionStore;
  cache: cache.TtlCache<DefaultWarmupException>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWarmupExceptionStore,
    cacheValue: cache.TtlCache<DefaultWarmupException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWarmupException | undefined {
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

  save(item: DefaultWarmupException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWarmupException[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWarmupExceptionStore(inner: DefaultWarmupExceptionStore, ttl: number, clockValue: clock.Clock): DefaultWarmupExceptionStore {
  return new CachedDefaultWarmupExceptionStore(
    inner,
    cache.newTtlCache<DefaultWarmupException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default warmup exceptions. Empty fields match all. */
export class DefaultWarmupExceptionQuery {
  channel: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWarmupException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWarmupException[]): DefaultWarmupException[] {
    const matched = collections.filter(items, (candidate: DefaultWarmupException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWarmupExceptions(store: DefaultWarmupExceptionStore, query: DefaultWarmupExceptionQuery): DefaultWarmupException[] {
  return query.apply(store.list());
}
