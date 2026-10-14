import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionBaseline } from "./mention-baseline.js";

/** Keeps mention baselines by code. */
export interface MentionBaselineStore {
  find(code: string): MentionBaseline | undefined;
  save(item: MentionBaseline): void;
  remove(code: string): boolean;
  list(): MentionBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionBaselineStore implements MentionBaselineStore {
  items: Map<string, MentionBaseline>;
  order: string[];

  constructor(items: Map<string, MentionBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionBaseline): void {
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

  list(): MentionBaseline[] {
    const out: MentionBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionBaselineStore(): MentionBaselineStore {
  return new MemoryMentionBaselineStore(new Map<string, MentionBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionBaselineStore implements MentionBaselineStore {
  inner: MentionBaselineStore;
  cache: cache.TtlCache<MentionBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionBaselineStore,
    cacheValue: cache.TtlCache<MentionBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionBaseline | undefined {
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

  save(item: MentionBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionBaseline[] {
    return this.inner.list();
  }
}

export function newCachedMentionBaselineStore(inner: MentionBaselineStore, ttl: number, clockValue: clock.Clock): MentionBaselineStore {
  return new CachedMentionBaselineStore(inner, cache.newTtlCache<MentionBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects mention baselines. Empty fields match all. */
export class MentionBaselineQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionBaseline[]): MentionBaseline[] {
    const matched = collections.filter(items, (candidate: MentionBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionBaselines(store: MentionBaselineStore, query: MentionBaselineQuery): MentionBaseline[] {
  return query.apply(store.list());
}
