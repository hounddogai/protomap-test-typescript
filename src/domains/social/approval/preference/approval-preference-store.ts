import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalPreference } from "./approval-preference.js";

/** Keeps approval preferences by code. */
export interface ApprovalPreferenceStore {
  find(code: string): ApprovalPreference | undefined;
  save(item: ApprovalPreference): void;
  remove(code: string): boolean;
  list(): ApprovalPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalPreferenceStore implements ApprovalPreferenceStore {
  items: Map<string, ApprovalPreference>;
  order: string[];

  constructor(items: Map<string, ApprovalPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalPreference): void {
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

  list(): ApprovalPreference[] {
    const out: ApprovalPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalPreferenceStore(): ApprovalPreferenceStore {
  return new MemoryApprovalPreferenceStore(new Map<string, ApprovalPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalPreferenceStore implements ApprovalPreferenceStore {
  inner: ApprovalPreferenceStore;
  cache: cache.TtlCache<ApprovalPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalPreferenceStore,
    cacheValue: cache.TtlCache<ApprovalPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalPreference | undefined {
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

  save(item: ApprovalPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalPreference[] {
    return this.inner.list();
  }
}

export function newCachedApprovalPreferenceStore(inner: ApprovalPreferenceStore, ttl: number, clockValue: clock.Clock): ApprovalPreferenceStore {
  return new CachedApprovalPreferenceStore(inner, cache.newTtlCache<ApprovalPreference>(512, ttl, clockValue), 0, 0);
}

/** Selects approval preferences. Empty fields match all. */
export class ApprovalPreferenceQuery {
  utmSource: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minImpressions: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalPreference): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalPreference[]): ApprovalPreference[] {
    const matched = collections.filter(items, (candidate: ApprovalPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalPreferences(store: ApprovalPreferenceStore, query: ApprovalPreferenceQuery): ApprovalPreference[] {
  return query.apply(store.list());
}
