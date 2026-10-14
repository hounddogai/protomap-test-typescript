import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultNudgeException } from "./default-nudge-exception.js";

/** Keeps default nudge exceptions by code. */
export interface DefaultNudgeExceptionStore {
  find(code: string): DefaultNudgeException | undefined;
  save(item: DefaultNudgeException): void;
  remove(code: string): boolean;
  list(): DefaultNudgeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultNudgeExceptionStore implements DefaultNudgeExceptionStore {
  items: Map<string, DefaultNudgeException>;
  order: string[];

  constructor(items: Map<string, DefaultNudgeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultNudgeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultNudgeException): void {
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

  list(): DefaultNudgeException[] {
    const out: DefaultNudgeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultNudgeExceptionStore(): DefaultNudgeExceptionStore {
  return new MemoryDefaultNudgeExceptionStore(new Map<string, DefaultNudgeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultNudgeExceptionStore implements DefaultNudgeExceptionStore {
  inner: DefaultNudgeExceptionStore;
  cache: cache.TtlCache<DefaultNudgeException>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultNudgeExceptionStore,
    cacheValue: cache.TtlCache<DefaultNudgeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultNudgeException | undefined {
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

  save(item: DefaultNudgeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultNudgeException[] {
    return this.inner.list();
  }
}

export function newCachedDefaultNudgeExceptionStore(inner: DefaultNudgeExceptionStore, ttl: number, clockValue: clock.Clock): DefaultNudgeExceptionStore {
  return new CachedDefaultNudgeExceptionStore(
    inner,
    cache.newTtlCache<DefaultNudgeException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default nudge exceptions. Empty fields match all. */
export class DefaultNudgeExceptionQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultNudgeException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultNudgeException[]): DefaultNudgeException[] {
    const matched = collections.filter(items, (candidate: DefaultNudgeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultNudgeExceptions(store: DefaultNudgeExceptionStore, query: DefaultNudgeExceptionQuery): DefaultNudgeException[] {
  return query.apply(store.list());
}
