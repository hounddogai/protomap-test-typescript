import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteProfile } from "./invite-profile.js";

/** Keeps invite profiles by code. */
export interface InviteProfileStore {
  find(code: string): InviteProfile | undefined;
  save(item: InviteProfile): void;
  remove(code: string): boolean;
  list(): InviteProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteProfileStore implements InviteProfileStore {
  items: Map<string, InviteProfile>;
  order: string[];

  constructor(items: Map<string, InviteProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteProfile): void {
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

  list(): InviteProfile[] {
    const out: InviteProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteProfileStore(): InviteProfileStore {
  return new MemoryInviteProfileStore(new Map<string, InviteProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteProfileStore implements InviteProfileStore {
  inner: InviteProfileStore;
  cache: cache.TtlCache<InviteProfile>;
  hits: number;
  misses: number;

  constructor(inner: InviteProfileStore, cacheValue: cache.TtlCache<InviteProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteProfile | undefined {
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

  save(item: InviteProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteProfile[] {
    return this.inner.list();
  }
}

export function newCachedInviteProfileStore(inner: InviteProfileStore, ttl: number, clockValue: clock.Clock): InviteProfileStore {
  return new CachedInviteProfileStore(inner, cache.newTtlCache<InviteProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects invite profiles. Empty fields match all. */
export class InviteProfileQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteProfile): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteProfile[]): InviteProfile[] {
    const matched = collections.filter(items, (candidate: InviteProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteProfiles(store: InviteProfileStore, query: InviteProfileQuery): InviteProfile[] {
  return query.apply(store.list());
}
