import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyMacroPolicy } from "./legacy-macro-policy.js";

/** Keeps legacy macro policies by code. */
export interface LegacyMacroPolicyStore {
  find(code: string): LegacyMacroPolicy | undefined;
  save(item: LegacyMacroPolicy): void;
  remove(code: string): boolean;
  list(): LegacyMacroPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyMacroPolicyStore implements LegacyMacroPolicyStore {
  items: Map<string, LegacyMacroPolicy>;
  order: string[];

  constructor(items: Map<string, LegacyMacroPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyMacroPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyMacroPolicy): void {
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

  list(): LegacyMacroPolicy[] {
    const out: LegacyMacroPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyMacroPolicyStore(): LegacyMacroPolicyStore {
  return new MemoryLegacyMacroPolicyStore(new Map<string, LegacyMacroPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyMacroPolicyStore implements LegacyMacroPolicyStore {
  inner: LegacyMacroPolicyStore;
  cache: cache.TtlCache<LegacyMacroPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyMacroPolicyStore,
    cacheValue: cache.TtlCache<LegacyMacroPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyMacroPolicy | undefined {
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

  save(item: LegacyMacroPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyMacroPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLegacyMacroPolicyStore(inner: LegacyMacroPolicyStore, ttl: number, clockValue: clock.Clock): LegacyMacroPolicyStore {
  return new CachedLegacyMacroPolicyStore(inner, cache.newTtlCache<LegacyMacroPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy macro policies. Empty fields match all. */
export class LegacyMacroPolicyQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyMacroPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyMacroPolicy[]): LegacyMacroPolicy[] {
    const matched = collections.filter(items, (candidate: LegacyMacroPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyMacroPolicies(store: LegacyMacroPolicyStore, query: LegacyMacroPolicyQuery): LegacyMacroPolicy[] {
  return query.apply(store.list());
}
