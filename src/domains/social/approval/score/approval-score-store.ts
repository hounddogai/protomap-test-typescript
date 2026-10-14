import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalScore } from "./approval-score.js";

/** Keeps approval scores by code. */
export interface ApprovalScoreStore {
  find(code: string): ApprovalScore | undefined;
  save(item: ApprovalScore): void;
  remove(code: string): boolean;
  list(): ApprovalScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalScoreStore implements ApprovalScoreStore {
  items: Map<string, ApprovalScore>;
  order: string[];

  constructor(items: Map<string, ApprovalScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalScore): void {
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

  list(): ApprovalScore[] {
    const out: ApprovalScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalScoreStore(): ApprovalScoreStore {
  return new MemoryApprovalScoreStore(new Map<string, ApprovalScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalScoreStore implements ApprovalScoreStore {
  inner: ApprovalScoreStore;
  cache: cache.TtlCache<ApprovalScore>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalScoreStore, cacheValue: cache.TtlCache<ApprovalScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalScore | undefined {
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

  save(item: ApprovalScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalScore[] {
    return this.inner.list();
  }
}

export function newCachedApprovalScoreStore(inner: ApprovalScoreStore, ttl: number, clockValue: clock.Clock): ApprovalScoreStore {
  return new CachedApprovalScoreStore(inner, cache.newTtlCache<ApprovalScore>(128, ttl, clockValue), 0, 0);
}

/** Selects approval scores. Empty fields match all. */
export class ApprovalScoreQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalScore[]): ApprovalScore[] {
    const matched = collections.filter(items, (candidate: ApprovalScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalScores(store: ApprovalScoreStore, query: ApprovalScoreQuery): ApprovalScore[] {
  return query.apply(store.list());
}
