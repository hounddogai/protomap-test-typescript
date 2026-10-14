import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalProfile } from "./approval-profile.js";

/** Keeps approval profiles by code. */
export interface ApprovalProfileStore {
  find(code: string): ApprovalProfile | undefined;
  save(item: ApprovalProfile): void;
  remove(code: string): boolean;
  list(): ApprovalProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalProfileStore implements ApprovalProfileStore {
  items: Map<string, ApprovalProfile>;
  order: string[];

  constructor(items: Map<string, ApprovalProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalProfile): void {
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

  list(): ApprovalProfile[] {
    const out: ApprovalProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalProfileStore(): ApprovalProfileStore {
  return new MemoryApprovalProfileStore(new Map<string, ApprovalProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalProfileStore implements ApprovalProfileStore {
  inner: ApprovalProfileStore;
  cache: cache.TtlCache<ApprovalProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalProfileStore,
    cacheValue: cache.TtlCache<ApprovalProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalProfile | undefined {
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

  save(item: ApprovalProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalProfile[] {
    return this.inner.list();
  }
}

export function newCachedApprovalProfileStore(inner: ApprovalProfileStore, ttl: number, clockValue: clock.Clock): ApprovalProfileStore {
  return new CachedApprovalProfileStore(inner, cache.newTtlCache<ApprovalProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects approval profiles. Empty fields match all. */
export class ApprovalProfileQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalProfile): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalProfile[]): ApprovalProfile[] {
    const matched = collections.filter(items, (candidate: ApprovalProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalProfiles(store: ApprovalProfileStore, query: ApprovalProfileQuery): ApprovalProfile[] {
  return query.apply(store.list());
}
