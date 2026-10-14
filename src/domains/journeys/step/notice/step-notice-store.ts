import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepNotice } from "./step-notice.js";

/** Keeps step notices by code. */
export interface StepNoticeStore {
  find(code: string): StepNotice | undefined;
  save(item: StepNotice): void;
  remove(code: string): boolean;
  list(): StepNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepNoticeStore implements StepNoticeStore {
  items: Map<string, StepNotice>;
  order: string[];

  constructor(items: Map<string, StepNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepNotice): void {
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

  list(): StepNotice[] {
    const out: StepNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepNoticeStore(): StepNoticeStore {
  return new MemoryStepNoticeStore(new Map<string, StepNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepNoticeStore implements StepNoticeStore {
  inner: StepNoticeStore;
  cache: cache.TtlCache<StepNotice>;
  hits: number;
  misses: number;

  constructor(inner: StepNoticeStore, cacheValue: cache.TtlCache<StepNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepNotice | undefined {
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

  save(item: StepNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepNotice[] {
    return this.inner.list();
  }
}

export function newCachedStepNoticeStore(inner: StepNoticeStore, ttl: number, clockValue: clock.Clock): StepNoticeStore {
  return new CachedStepNoticeStore(inner, cache.newTtlCache<StepNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects step notices. Empty fields match all. */
export class StepNoticeQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepNotice[]): StepNotice[] {
    const matched = collections.filter(items, (candidate: StepNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepNotices(store: StepNoticeStore, query: StepNoticeQuery): StepNotice[] {
  return query.apply(store.list());
}
