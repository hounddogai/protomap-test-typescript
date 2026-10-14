import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

/** Keeps primary reward rule manifests by code. */
export interface PrimaryRewardRuleManifestStore {
  find(code: string): PrimaryRewardRuleManifest | undefined;
  save(item: PrimaryRewardRuleManifest): void;
  remove(code: string): boolean;
  list(): PrimaryRewardRuleManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryRewardRuleManifestStore implements PrimaryRewardRuleManifestStore {
  items: Map<string, PrimaryRewardRuleManifest>;
  order: string[];

  constructor(items: Map<string, PrimaryRewardRuleManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryRewardRuleManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryRewardRuleManifest): void {
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

  list(): PrimaryRewardRuleManifest[] {
    const out: PrimaryRewardRuleManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryRewardRuleManifestStore(): PrimaryRewardRuleManifestStore {
  return new MemoryPrimaryRewardRuleManifestStore(new Map<string, PrimaryRewardRuleManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryRewardRuleManifestStore implements PrimaryRewardRuleManifestStore {
  inner: PrimaryRewardRuleManifestStore;
  cache: cache.TtlCache<PrimaryRewardRuleManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryRewardRuleManifestStore,
    cacheValue: cache.TtlCache<PrimaryRewardRuleManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryRewardRuleManifest | undefined {
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

  save(item: PrimaryRewardRuleManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryRewardRuleManifest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryRewardRuleManifestStore(inner: PrimaryRewardRuleManifestStore, ttl: number, clockValue: clock.Clock): PrimaryRewardRuleManifestStore {
  return new CachedPrimaryRewardRuleManifestStore(
    inner,
    cache.newTtlCache<PrimaryRewardRuleManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary reward rule manifests. Empty fields match all. */
export class PrimaryRewardRuleManifestQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryRewardRuleManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryRewardRuleManifest[]): PrimaryRewardRuleManifest[] {
    const matched = collections.filter(items, (candidate: PrimaryRewardRuleManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryRewardRuleManifests(store: PrimaryRewardRuleManifestStore, query: PrimaryRewardRuleManifestQuery): PrimaryRewardRuleManifest[] {
  return query.apply(store.list());
}
