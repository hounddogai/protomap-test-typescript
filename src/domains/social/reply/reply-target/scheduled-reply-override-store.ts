import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledReplyOverride } from "./scheduled-reply-override.js";

/** Keeps scheduled reply overrides by code. */
export interface ScheduledReplyOverrideStore {
  find(code: string): ScheduledReplyOverride | undefined;
  save(item: ScheduledReplyOverride): void;
  remove(code: string): boolean;
  list(): ScheduledReplyOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledReplyOverrideStore implements ScheduledReplyOverrideStore {
  items: Map<string, ScheduledReplyOverride>;
  order: string[];

  constructor(items: Map<string, ScheduledReplyOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledReplyOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledReplyOverride): void {
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

  list(): ScheduledReplyOverride[] {
    const out: ScheduledReplyOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledReplyOverrideStore(): ScheduledReplyOverrideStore {
  return new MemoryScheduledReplyOverrideStore(new Map<string, ScheduledReplyOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledReplyOverrideStore implements ScheduledReplyOverrideStore {
  inner: ScheduledReplyOverrideStore;
  cache: cache.TtlCache<ScheduledReplyOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledReplyOverrideStore,
    cacheValue: cache.TtlCache<ScheduledReplyOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledReplyOverride | undefined {
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

  save(item: ScheduledReplyOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledReplyOverride[] {
    return this.inner.list();
  }
}

export function newCachedScheduledReplyOverrideStore(inner: ScheduledReplyOverrideStore, ttl: number, clockValue: clock.Clock): ScheduledReplyOverrideStore {
  return new CachedScheduledReplyOverrideStore(
    inner,
    cache.newTtlCache<ScheduledReplyOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled reply overrides. Empty fields match all. */
export class ScheduledReplyOverrideQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledReplyOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledReplyOverride[]): ScheduledReplyOverride[] {
    const matched = collections.filter(items, (candidate: ScheduledReplyOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledReplyOverrides(store: ScheduledReplyOverrideStore, query: ScheduledReplyOverrideQuery): ScheduledReplyOverride[] {
  return query.apply(store.list());
}
