import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionException } from "./mention-exception.js";

/** Keeps mention exceptions by code. */
export interface MentionExceptionStore {
  find(code: string): MentionException | undefined;
  save(item: MentionException): void;
  remove(code: string): boolean;
  list(): MentionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionExceptionStore implements MentionExceptionStore {
  items: Map<string, MentionException>;
  order: string[];

  constructor(items: Map<string, MentionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionException): void {
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

  list(): MentionException[] {
    const out: MentionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionExceptionStore(): MentionExceptionStore {
  return new MemoryMentionExceptionStore(new Map<string, MentionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionExceptionStore implements MentionExceptionStore {
  inner: MentionExceptionStore;
  cache: cache.TtlCache<MentionException>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionExceptionStore,
    cacheValue: cache.TtlCache<MentionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionException | undefined {
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

  save(item: MentionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionException[] {
    return this.inner.list();
  }
}

export function newCachedMentionExceptionStore(inner: MentionExceptionStore, ttl: number, clockValue: clock.Clock): MentionExceptionStore {
  return new CachedMentionExceptionStore(inner, cache.newTtlCache<MentionException>(64, ttl, clockValue), 0, 0);
}

/** Selects mention exceptions. Empty fields match all. */
export class MentionExceptionQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionException[]): MentionException[] {
    const matched = collections.filter(items, (candidate: MentionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionExceptions(store: MentionExceptionStore, query: MentionExceptionQuery): MentionException[] {
  return query.apply(store.list());
}
