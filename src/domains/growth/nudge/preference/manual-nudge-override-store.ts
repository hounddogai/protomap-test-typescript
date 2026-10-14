import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualNudgeOverride } from "./manual-nudge-override.js";

/** Keeps manual nudge overrides by code. */
export interface ManualNudgeOverrideStore {
  find(code: string): ManualNudgeOverride | undefined;
  save(item: ManualNudgeOverride): void;
  remove(code: string): boolean;
  list(): ManualNudgeOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualNudgeOverrideStore implements ManualNudgeOverrideStore {
  items: Map<string, ManualNudgeOverride>;
  order: string[];

  constructor(items: Map<string, ManualNudgeOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualNudgeOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualNudgeOverride): void {
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

  list(): ManualNudgeOverride[] {
    const out: ManualNudgeOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualNudgeOverrideStore(): ManualNudgeOverrideStore {
  return new MemoryManualNudgeOverrideStore(new Map<string, ManualNudgeOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualNudgeOverrideStore implements ManualNudgeOverrideStore {
  inner: ManualNudgeOverrideStore;
  cache: cache.TtlCache<ManualNudgeOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualNudgeOverrideStore,
    cacheValue: cache.TtlCache<ManualNudgeOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualNudgeOverride | undefined {
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

  save(item: ManualNudgeOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualNudgeOverride[] {
    return this.inner.list();
  }
}

export function newCachedManualNudgeOverrideStore(inner: ManualNudgeOverrideStore, ttl: number, clockValue: clock.Clock): ManualNudgeOverrideStore {
  return new CachedManualNudgeOverrideStore(inner, cache.newTtlCache<ManualNudgeOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects manual nudge overrides. Empty fields match all. */
export class ManualNudgeOverrideQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualNudgeOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualNudgeOverride[]): ManualNudgeOverride[] {
    const matched = collections.filter(items, (candidate: ManualNudgeOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualNudgeOverrides(store: ManualNudgeOverrideStore, query: ManualNudgeOverrideQuery): ManualNudgeOverride[] {
  return query.apply(store.list());
}
