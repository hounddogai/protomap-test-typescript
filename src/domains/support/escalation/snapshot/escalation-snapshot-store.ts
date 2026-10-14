import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationSnapshot } from "./escalation-snapshot.js";

/** Keeps escalation snapshots by code. */
export interface EscalationSnapshotStore {
  find(code: string): EscalationSnapshot | undefined;
  save(item: EscalationSnapshot): void;
  remove(code: string): boolean;
  list(): EscalationSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationSnapshotStore implements EscalationSnapshotStore {
  items: Map<string, EscalationSnapshot>;
  order: string[];

  constructor(items: Map<string, EscalationSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationSnapshot): void {
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

  list(): EscalationSnapshot[] {
    const out: EscalationSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationSnapshotStore(): EscalationSnapshotStore {
  return new MemoryEscalationSnapshotStore(new Map<string, EscalationSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationSnapshotStore implements EscalationSnapshotStore {
  inner: EscalationSnapshotStore;
  cache: cache.TtlCache<EscalationSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationSnapshotStore,
    cacheValue: cache.TtlCache<EscalationSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationSnapshot | undefined {
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

  save(item: EscalationSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedEscalationSnapshotStore(inner: EscalationSnapshotStore, ttl: number, clockValue: clock.Clock): EscalationSnapshotStore {
  return new CachedEscalationSnapshotStore(inner, cache.newTtlCache<EscalationSnapshot>(128, ttl, clockValue), 0, 0);
}

/** Selects escalation snapshots. Empty fields match all. */
export class EscalationSnapshotQuery {
  category: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minOpenRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationSnapshot): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationSnapshot[]): EscalationSnapshot[] {
    const matched = collections.filter(items, (candidate: EscalationSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationSnapshots(store: EscalationSnapshotStore, query: EscalationSnapshotQuery): EscalationSnapshot[] {
  return query.apply(store.list());
}
