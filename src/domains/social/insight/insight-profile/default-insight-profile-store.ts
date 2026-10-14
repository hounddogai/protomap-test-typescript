import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultInsightProfile } from "./default-insight-profile.js";

/** Keeps default insight profiles by code. */
export interface DefaultInsightProfileStore {
  find(code: string): DefaultInsightProfile | undefined;
  save(item: DefaultInsightProfile): void;
  remove(code: string): boolean;
  list(): DefaultInsightProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultInsightProfileStore implements DefaultInsightProfileStore {
  items: Map<string, DefaultInsightProfile>;
  order: string[];

  constructor(items: Map<string, DefaultInsightProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultInsightProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultInsightProfile): void {
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

  list(): DefaultInsightProfile[] {
    const out: DefaultInsightProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultInsightProfileStore(): DefaultInsightProfileStore {
  return new MemoryDefaultInsightProfileStore(new Map<string, DefaultInsightProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultInsightProfileStore implements DefaultInsightProfileStore {
  inner: DefaultInsightProfileStore;
  cache: cache.TtlCache<DefaultInsightProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultInsightProfileStore,
    cacheValue: cache.TtlCache<DefaultInsightProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultInsightProfile | undefined {
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

  save(item: DefaultInsightProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultInsightProfile[] {
    return this.inner.list();
  }
}

export function newCachedDefaultInsightProfileStore(inner: DefaultInsightProfileStore, ttl: number, clockValue: clock.Clock): DefaultInsightProfileStore {
  return new CachedDefaultInsightProfileStore(
    inner,
    cache.newTtlCache<DefaultInsightProfile>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default insight profiles. Empty fields match all. */
export class DefaultInsightProfileQuery {
  unit: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMinimum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultInsightProfile): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultInsightProfile[]): DefaultInsightProfile[] {
    const matched = collections.filter(items, (candidate: DefaultInsightProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultInsightProfiles(store: DefaultInsightProfileStore, query: DefaultInsightProfileQuery): DefaultInsightProfile[] {
  return query.apply(store.list());
}
