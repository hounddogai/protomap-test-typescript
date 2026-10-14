import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeRequest } from "./nudge-request.js";

/** Keeps nudge requests by code. */
export interface NudgeRequestStore {
  find(code: string): NudgeRequest | undefined;
  save(item: NudgeRequest): void;
  remove(code: string): boolean;
  list(): NudgeRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeRequestStore implements NudgeRequestStore {
  items: Map<string, NudgeRequest>;
  order: string[];

  constructor(items: Map<string, NudgeRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeRequest): void {
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

  list(): NudgeRequest[] {
    const out: NudgeRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeRequestStore(): NudgeRequestStore {
  return new MemoryNudgeRequestStore(new Map<string, NudgeRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeRequestStore implements NudgeRequestStore {
  inner: NudgeRequestStore;
  cache: cache.TtlCache<NudgeRequest>;
  hits: number;
  misses: number;

  constructor(inner: NudgeRequestStore, cacheValue: cache.TtlCache<NudgeRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeRequest | undefined {
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

  save(item: NudgeRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeRequest[] {
    return this.inner.list();
  }
}

export function newCachedNudgeRequestStore(inner: NudgeRequestStore, ttl: number, clockValue: clock.Clock): NudgeRequestStore {
  return new CachedNudgeRequestStore(inner, cache.newTtlCache<NudgeRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects nudge requests. Empty fields match all. */
export class NudgeRequestQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeRequest[]): NudgeRequest[] {
    const matched = collections.filter(items, (candidate: NudgeRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeRequests(store: NudgeRequestStore, query: NudgeRequestQuery): NudgeRequest[] {
  return query.apply(store.list());
}
