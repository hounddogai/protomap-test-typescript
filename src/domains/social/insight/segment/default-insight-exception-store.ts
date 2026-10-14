import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultInsightException } from "./default-insight-exception.js";

/** Keeps default insight exceptions by code. */
export interface DefaultInsightExceptionStore {
  find(code: string): DefaultInsightException | undefined;
  save(item: DefaultInsightException): void;
  remove(code: string): boolean;
  list(): DefaultInsightException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultInsightExceptionStore implements DefaultInsightExceptionStore {
  items: Map<string, DefaultInsightException>;
  order: string[];

  constructor(items: Map<string, DefaultInsightException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultInsightException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultInsightException): void {
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

  list(): DefaultInsightException[] {
    const out: DefaultInsightException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultInsightExceptionStore(): DefaultInsightExceptionStore {
  return new MemoryDefaultInsightExceptionStore(new Map<string, DefaultInsightException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultInsightExceptionStore implements DefaultInsightExceptionStore {
  inner: DefaultInsightExceptionStore;
  cache: cache.TtlCache<DefaultInsightException>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultInsightExceptionStore,
    cacheValue: cache.TtlCache<DefaultInsightException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultInsightException | undefined {
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

  save(item: DefaultInsightException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultInsightException[] {
    return this.inner.list();
  }
}

export function newCachedDefaultInsightExceptionStore(inner: DefaultInsightExceptionStore, ttl: number, clockValue: clock.Clock): DefaultInsightExceptionStore {
  return new CachedDefaultInsightExceptionStore(
    inner,
    cache.newTtlCache<DefaultInsightException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default insight exceptions. Empty fields match all. */
export class DefaultInsightExceptionQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultInsightException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultInsightException[]): DefaultInsightException[] {
    const matched = collections.filter(items, (candidate: DefaultInsightException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultInsightExceptions(store: DefaultInsightExceptionStore, query: DefaultInsightExceptionQuery): DefaultInsightException[] {
  return query.apply(store.list());
}
