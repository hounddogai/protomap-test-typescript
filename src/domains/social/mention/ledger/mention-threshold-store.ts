import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionThreshold } from "./mention-threshold.js";

/** Keeps mention thresholds by code. */
export interface MentionThresholdStore {
  find(code: string): MentionThreshold | undefined;
  save(item: MentionThreshold): void;
  remove(code: string): boolean;
  list(): MentionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionThresholdStore implements MentionThresholdStore {
  items: Map<string, MentionThreshold>;
  order: string[];

  constructor(items: Map<string, MentionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionThreshold): void {
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

  list(): MentionThreshold[] {
    const out: MentionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionThresholdStore(): MentionThresholdStore {
  return new MemoryMentionThresholdStore(new Map<string, MentionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionThresholdStore implements MentionThresholdStore {
  inner: MentionThresholdStore;
  cache: cache.TtlCache<MentionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionThresholdStore,
    cacheValue: cache.TtlCache<MentionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionThreshold | undefined {
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

  save(item: MentionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedMentionThresholdStore(inner: MentionThresholdStore, ttl: number, clockValue: clock.Clock): MentionThresholdStore {
  return new CachedMentionThresholdStore(inner, cache.newTtlCache<MentionThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects mention thresholds. Empty fields match all. */
export class MentionThresholdQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionThreshold[]): MentionThreshold[] {
    const matched = collections.filter(items, (candidate: MentionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionThresholds(store: MentionThresholdStore, query: MentionThresholdQuery): MentionThreshold[] {
  return query.apply(store.list());
}
