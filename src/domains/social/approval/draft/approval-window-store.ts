import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalWindow } from "./approval-window.js";

/** Keeps approval windows by code. */
export interface ApprovalWindowStore {
  find(code: string): ApprovalWindow | undefined;
  save(item: ApprovalWindow): void;
  remove(code: string): boolean;
  list(): ApprovalWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalWindowStore implements ApprovalWindowStore {
  items: Map<string, ApprovalWindow>;
  order: string[];

  constructor(items: Map<string, ApprovalWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalWindow): void {
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

  list(): ApprovalWindow[] {
    const out: ApprovalWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalWindowStore(): ApprovalWindowStore {
  return new MemoryApprovalWindowStore(new Map<string, ApprovalWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalWindowStore implements ApprovalWindowStore {
  inner: ApprovalWindowStore;
  cache: cache.TtlCache<ApprovalWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalWindowStore,
    cacheValue: cache.TtlCache<ApprovalWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalWindow | undefined {
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

  save(item: ApprovalWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalWindow[] {
    return this.inner.list();
  }
}

export function newCachedApprovalWindowStore(inner: ApprovalWindowStore, ttl: number, clockValue: clock.Clock): ApprovalWindowStore {
  return new CachedApprovalWindowStore(inner, cache.newTtlCache<ApprovalWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects approval windows. Empty fields match all. */
export class ApprovalWindowQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalWindow): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalWindow[]): ApprovalWindow[] {
    const matched = collections.filter(items, (candidate: ApprovalWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalWindows(store: ApprovalWindowStore, query: ApprovalWindowQuery): ApprovalWindow[] {
  return query.apply(store.list());
}
