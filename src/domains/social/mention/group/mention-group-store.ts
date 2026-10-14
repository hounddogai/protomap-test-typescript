import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionGroup } from "./mention-group.js";

/** Keeps mention groups by code. */
export interface MentionGroupStore {
  find(code: string): MentionGroup | undefined;
  save(item: MentionGroup): void;
  remove(code: string): boolean;
  list(): MentionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionGroupStore implements MentionGroupStore {
  items: Map<string, MentionGroup>;
  order: string[];

  constructor(items: Map<string, MentionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionGroup): void {
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

  list(): MentionGroup[] {
    const out: MentionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionGroupStore(): MentionGroupStore {
  return new MemoryMentionGroupStore(new Map<string, MentionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionGroupStore implements MentionGroupStore {
  inner: MentionGroupStore;
  cache: cache.TtlCache<MentionGroup>;
  hits: number;
  misses: number;

  constructor(inner: MentionGroupStore, cacheValue: cache.TtlCache<MentionGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionGroup | undefined {
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

  save(item: MentionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionGroup[] {
    return this.inner.list();
  }
}

export function newCachedMentionGroupStore(inner: MentionGroupStore, ttl: number, clockValue: clock.Clock): MentionGroupStore {
  return new CachedMentionGroupStore(inner, cache.newTtlCache<MentionGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects mention groups. Empty fields match all. */
export class MentionGroupQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionGroup[]): MentionGroup[] {
    const matched = collections.filter(items, (candidate: MentionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionGroups(store: MentionGroupStore, query: MentionGroupQuery): MentionGroup[] {
  return query.apply(store.list());
}
