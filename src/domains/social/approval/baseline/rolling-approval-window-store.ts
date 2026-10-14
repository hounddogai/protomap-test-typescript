import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingApprovalWindow } from "./rolling-approval-window.js";

/** Keeps rolling approval windows by code. */
export interface RollingApprovalWindowStore {
  find(code: string): RollingApprovalWindow | undefined;
  save(item: RollingApprovalWindow): void;
  remove(code: string): boolean;
  list(): RollingApprovalWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingApprovalWindowStore implements RollingApprovalWindowStore {
  items: Map<string, RollingApprovalWindow>;
  order: string[];

  constructor(items: Map<string, RollingApprovalWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingApprovalWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingApprovalWindow): void {
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

  list(): RollingApprovalWindow[] {
    const out: RollingApprovalWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingApprovalWindowStore(): RollingApprovalWindowStore {
  return new MemoryRollingApprovalWindowStore(new Map<string, RollingApprovalWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingApprovalWindowStore implements RollingApprovalWindowStore {
  inner: RollingApprovalWindowStore;
  cache: cache.TtlCache<RollingApprovalWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingApprovalWindowStore,
    cacheValue: cache.TtlCache<RollingApprovalWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingApprovalWindow | undefined {
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

  save(item: RollingApprovalWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingApprovalWindow[] {
    return this.inner.list();
  }
}

export function newCachedRollingApprovalWindowStore(inner: RollingApprovalWindowStore, ttl: number, clockValue: clock.Clock): RollingApprovalWindowStore {
  return new CachedRollingApprovalWindowStore(
    inner,
    cache.newTtlCache<RollingApprovalWindow>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling approval windows. Empty fields match all. */
export class RollingApprovalWindowQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingApprovalWindow): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingApprovalWindow[]): RollingApprovalWindow[] {
    const matched = collections.filter(items, (candidate: RollingApprovalWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingApprovalWindows(store: RollingApprovalWindowStore, query: RollingApprovalWindowQuery): RollingApprovalWindow[] {
  return query.apply(store.list());
}
