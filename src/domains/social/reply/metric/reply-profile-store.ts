import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyProfile } from "./reply-profile.js";

/** Keeps reply profiles by code. */
export interface ReplyProfileStore {
  find(code: string): ReplyProfile | undefined;
  save(item: ReplyProfile): void;
  remove(code: string): boolean;
  list(): ReplyProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyProfileStore implements ReplyProfileStore {
  items: Map<string, ReplyProfile>;
  order: string[];

  constructor(items: Map<string, ReplyProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyProfile): void {
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

  list(): ReplyProfile[] {
    const out: ReplyProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyProfileStore(): ReplyProfileStore {
  return new MemoryReplyProfileStore(new Map<string, ReplyProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyProfileStore implements ReplyProfileStore {
  inner: ReplyProfileStore;
  cache: cache.TtlCache<ReplyProfile>;
  hits: number;
  misses: number;

  constructor(inner: ReplyProfileStore, cacheValue: cache.TtlCache<ReplyProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyProfile | undefined {
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

  save(item: ReplyProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyProfile[] {
    return this.inner.list();
  }
}

export function newCachedReplyProfileStore(inner: ReplyProfileStore, ttl: number, clockValue: clock.Clock): ReplyProfileStore {
  return new CachedReplyProfileStore(inner, cache.newTtlCache<ReplyProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects reply profiles. Empty fields match all. */
export class ReplyProfileQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyProfile[]): ReplyProfile[] {
    const matched = collections.filter(items, (candidate: ReplyProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyProfiles(store: ReplyProfileStore, query: ReplyProfileQuery): ReplyProfile[] {
  return query.apply(store.list());
}
