import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleSnapshot } from "./reward-rule-snapshot.js";

/** Keeps reward rule snapshots by code. */
export interface RewardRuleSnapshotStore {
  find(code: string): RewardRuleSnapshot | undefined;
  save(item: RewardRuleSnapshot): void;
  remove(code: string): boolean;
  list(): RewardRuleSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleSnapshotStore implements RewardRuleSnapshotStore {
  items: Map<string, RewardRuleSnapshot>;
  order: string[];

  constructor(items: Map<string, RewardRuleSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleSnapshot): void {
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

  list(): RewardRuleSnapshot[] {
    const out: RewardRuleSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleSnapshotStore(): RewardRuleSnapshotStore {
  return new MemoryRewardRuleSnapshotStore(new Map<string, RewardRuleSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleSnapshotStore implements RewardRuleSnapshotStore {
  inner: RewardRuleSnapshotStore;
  cache: cache.TtlCache<RewardRuleSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleSnapshotStore,
    cacheValue: cache.TtlCache<RewardRuleSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleSnapshot | undefined {
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

  save(item: RewardRuleSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleSnapshotStore(inner: RewardRuleSnapshotStore, ttl: number, clockValue: clock.Clock): RewardRuleSnapshotStore {
  return new CachedRewardRuleSnapshotStore(inner, cache.newTtlCache<RewardRuleSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects reward rule snapshots. Empty fields match all. */
export class RewardRuleSnapshotQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleSnapshot[]): RewardRuleSnapshot[] {
    const matched = collections.filter(items, (candidate: RewardRuleSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleSnapshots(store: RewardRuleSnapshotStore, query: RewardRuleSnapshotQuery): RewardRuleSnapshot[] {
  return query.apply(store.list());
}
