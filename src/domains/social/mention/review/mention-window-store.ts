import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionWindow } from "./mention-window.js";

/** Keeps mention windows by code. */
export interface MentionWindowStore {
  find(code: string): MentionWindow | undefined;
  save(item: MentionWindow): void;
  remove(code: string): boolean;
  list(): MentionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionWindowStore implements MentionWindowStore {
  items: Map<string, MentionWindow>;
  order: string[];

  constructor(items: Map<string, MentionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionWindow): void {
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

  list(): MentionWindow[] {
    const out: MentionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionWindowStore(): MentionWindowStore {
  return new MemoryMentionWindowStore(new Map<string, MentionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionWindowStore implements MentionWindowStore {
  inner: MentionWindowStore;
  cache: cache.TtlCache<MentionWindow>;
  hits: number;
  misses: number;

  constructor(inner: MentionWindowStore, cacheValue: cache.TtlCache<MentionWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionWindow | undefined {
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

  save(item: MentionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionWindow[] {
    return this.inner.list();
  }
}

export function newCachedMentionWindowStore(inner: MentionWindowStore, ttl: number, clockValue: clock.Clock): MentionWindowStore {
  return new CachedMentionWindowStore(inner, cache.newTtlCache<MentionWindow>(128, ttl, clockValue), 0, 0);
}

/** Selects mention windows. Empty fields match all. */
export class MentionWindowQuery {
  unit: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minGraceDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionWindow): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionWindow[]): MentionWindow[] {
    const matched = collections.filter(items, (candidate: MentionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionWindows(store: MentionWindowStore, query: MentionWindowQuery): MentionWindow[] {
  return query.apply(store.list());
}
