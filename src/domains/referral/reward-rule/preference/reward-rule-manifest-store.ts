import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleManifest } from "./reward-rule-manifest.js";

/** Keeps reward rule manifests by code. */
export interface RewardRuleManifestStore {
  find(code: string): RewardRuleManifest | undefined;
  save(item: RewardRuleManifest): void;
  remove(code: string): boolean;
  list(): RewardRuleManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleManifestStore implements RewardRuleManifestStore {
  items: Map<string, RewardRuleManifest>;
  order: string[];

  constructor(items: Map<string, RewardRuleManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleManifest): void {
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

  list(): RewardRuleManifest[] {
    const out: RewardRuleManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleManifestStore(): RewardRuleManifestStore {
  return new MemoryRewardRuleManifestStore(new Map<string, RewardRuleManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleManifestStore implements RewardRuleManifestStore {
  inner: RewardRuleManifestStore;
  cache: cache.TtlCache<RewardRuleManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleManifestStore,
    cacheValue: cache.TtlCache<RewardRuleManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleManifest | undefined {
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

  save(item: RewardRuleManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleManifest[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleManifestStore(inner: RewardRuleManifestStore, ttl: number, clockValue: clock.Clock): RewardRuleManifestStore {
  return new CachedRewardRuleManifestStore(inner, cache.newTtlCache<RewardRuleManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects reward rule manifests. Empty fields match all. */
export class RewardRuleManifestQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleManifest[]): RewardRuleManifest[] {
    const matched = collections.filter(items, (candidate: RewardRuleManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleManifests(store: RewardRuleManifestStore, query: RewardRuleManifestQuery): RewardRuleManifest[] {
  return query.apply(store.list());
}
