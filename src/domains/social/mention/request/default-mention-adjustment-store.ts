import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultMentionAdjustment } from "./default-mention-adjustment.js";

/** Keeps default mention adjustments by code. */
export interface DefaultMentionAdjustmentStore {
  find(code: string): DefaultMentionAdjustment | undefined;
  save(item: DefaultMentionAdjustment): void;
  remove(code: string): boolean;
  list(): DefaultMentionAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultMentionAdjustmentStore implements DefaultMentionAdjustmentStore {
  items: Map<string, DefaultMentionAdjustment>;
  order: string[];

  constructor(items: Map<string, DefaultMentionAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultMentionAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultMentionAdjustment): void {
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

  list(): DefaultMentionAdjustment[] {
    const out: DefaultMentionAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultMentionAdjustmentStore(): DefaultMentionAdjustmentStore {
  return new MemoryDefaultMentionAdjustmentStore(new Map<string, DefaultMentionAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultMentionAdjustmentStore implements DefaultMentionAdjustmentStore {
  inner: DefaultMentionAdjustmentStore;
  cache: cache.TtlCache<DefaultMentionAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultMentionAdjustmentStore,
    cacheValue: cache.TtlCache<DefaultMentionAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultMentionAdjustment | undefined {
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

  save(item: DefaultMentionAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultMentionAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultMentionAdjustmentStore(inner: DefaultMentionAdjustmentStore, ttl: number, clockValue: clock.Clock): DefaultMentionAdjustmentStore {
  return new CachedDefaultMentionAdjustmentStore(
    inner,
    cache.newTtlCache<DefaultMentionAdjustment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default mention adjustments. Empty fields match all. */
export class DefaultMentionAdjustmentQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultMentionAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultMentionAdjustment[]): DefaultMentionAdjustment[] {
    const matched = collections.filter(items, (candidate: DefaultMentionAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultMentionAdjustments(store: DefaultMentionAdjustmentStore, query: DefaultMentionAdjustmentQuery): DefaultMentionAdjustment[] {
  return query.apply(store.list());
}
