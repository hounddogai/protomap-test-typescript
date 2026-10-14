import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalCheckpoint } from "./approval-checkpoint.js";

/** Keeps approval checkpoints by code. */
export interface ApprovalCheckpointStore {
  find(code: string): ApprovalCheckpoint | undefined;
  save(item: ApprovalCheckpoint): void;
  remove(code: string): boolean;
  list(): ApprovalCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalCheckpointStore implements ApprovalCheckpointStore {
  items: Map<string, ApprovalCheckpoint>;
  order: string[];

  constructor(items: Map<string, ApprovalCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalCheckpoint): void {
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

  list(): ApprovalCheckpoint[] {
    const out: ApprovalCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalCheckpointStore(): ApprovalCheckpointStore {
  return new MemoryApprovalCheckpointStore(new Map<string, ApprovalCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalCheckpointStore implements ApprovalCheckpointStore {
  inner: ApprovalCheckpointStore;
  cache: cache.TtlCache<ApprovalCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalCheckpointStore,
    cacheValue: cache.TtlCache<ApprovalCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalCheckpoint | undefined {
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

  save(item: ApprovalCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedApprovalCheckpointStore(inner: ApprovalCheckpointStore, ttl: number, clockValue: clock.Clock): ApprovalCheckpointStore {
  return new CachedApprovalCheckpointStore(inner, cache.newTtlCache<ApprovalCheckpoint>(512, ttl, clockValue), 0, 0);
}

/** Selects approval checkpoints. Empty fields match all. */
export class ApprovalCheckpointQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalCheckpoint[]): ApprovalCheckpoint[] {
    const matched = collections.filter(items, (candidate: ApprovalCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalCheckpoints(store: ApprovalCheckpointStore, query: ApprovalCheckpointQuery): ApprovalCheckpoint[] {
  return query.apply(store.list());
}
