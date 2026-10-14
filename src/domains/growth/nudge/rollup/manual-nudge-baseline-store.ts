import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualNudgeBaseline } from "./manual-nudge-baseline.js";

/** Keeps manual nudge baselines by code. */
export interface ManualNudgeBaselineStore {
  find(code: string): ManualNudgeBaseline | undefined;
  save(item: ManualNudgeBaseline): void;
  remove(code: string): boolean;
  list(): ManualNudgeBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualNudgeBaselineStore implements ManualNudgeBaselineStore {
  items: Map<string, ManualNudgeBaseline>;
  order: string[];

  constructor(items: Map<string, ManualNudgeBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualNudgeBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualNudgeBaseline): void {
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

  list(): ManualNudgeBaseline[] {
    const out: ManualNudgeBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualNudgeBaselineStore(): ManualNudgeBaselineStore {
  return new MemoryManualNudgeBaselineStore(new Map<string, ManualNudgeBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualNudgeBaselineStore implements ManualNudgeBaselineStore {
  inner: ManualNudgeBaselineStore;
  cache: cache.TtlCache<ManualNudgeBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualNudgeBaselineStore,
    cacheValue: cache.TtlCache<ManualNudgeBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualNudgeBaseline | undefined {
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

  save(item: ManualNudgeBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualNudgeBaseline[] {
    return this.inner.list();
  }
}

export function newCachedManualNudgeBaselineStore(inner: ManualNudgeBaselineStore, ttl: number, clockValue: clock.Clock): ManualNudgeBaselineStore {
  return new CachedManualNudgeBaselineStore(inner, cache.newTtlCache<ManualNudgeBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects manual nudge baselines. Empty fields match all. */
export class ManualNudgeBaselineQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualNudgeBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualNudgeBaseline[]): ManualNudgeBaseline[] {
    const matched = collections.filter(items, (candidate: ManualNudgeBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualNudgeBaselines(store: ManualNudgeBaselineStore, query: ManualNudgeBaselineQuery): ManualNudgeBaseline[] {
  return query.apply(store.list());
}
