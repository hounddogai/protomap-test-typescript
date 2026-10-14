import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionCycle } from "./mention-cycle.js";

/** Keeps mention cycles by code. */
export interface MentionCycleStore {
  find(code: string): MentionCycle | undefined;
  save(item: MentionCycle): void;
  remove(code: string): boolean;
  list(): MentionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionCycleStore implements MentionCycleStore {
  items: Map<string, MentionCycle>;
  order: string[];

  constructor(items: Map<string, MentionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionCycle): void {
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

  list(): MentionCycle[] {
    const out: MentionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionCycleStore(): MentionCycleStore {
  return new MemoryMentionCycleStore(new Map<string, MentionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionCycleStore implements MentionCycleStore {
  inner: MentionCycleStore;
  cache: cache.TtlCache<MentionCycle>;
  hits: number;
  misses: number;

  constructor(inner: MentionCycleStore, cacheValue: cache.TtlCache<MentionCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionCycle | undefined {
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

  save(item: MentionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionCycle[] {
    return this.inner.list();
  }
}

export function newCachedMentionCycleStore(inner: MentionCycleStore, ttl: number, clockValue: clock.Clock): MentionCycleStore {
  return new CachedMentionCycleStore(inner, cache.newTtlCache<MentionCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention cycles. Empty fields match all. */
export class MentionCycleQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionCycle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionCycle[]): MentionCycle[] {
    const matched = collections.filter(items, (candidate: MentionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionCycles(store: MentionCycleStore, query: MentionCycleQuery): MentionCycle[] {
  return query.apply(store.list());
}
