import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalGroup } from "./approval-group.js";

/** Keeps approval groups by code. */
export interface ApprovalGroupStore {
  find(code: string): ApprovalGroup | undefined;
  save(item: ApprovalGroup): void;
  remove(code: string): boolean;
  list(): ApprovalGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalGroupStore implements ApprovalGroupStore {
  items: Map<string, ApprovalGroup>;
  order: string[];

  constructor(items: Map<string, ApprovalGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalGroup): void {
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

  list(): ApprovalGroup[] {
    const out: ApprovalGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalGroupStore(): ApprovalGroupStore {
  return new MemoryApprovalGroupStore(new Map<string, ApprovalGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalGroupStore implements ApprovalGroupStore {
  inner: ApprovalGroupStore;
  cache: cache.TtlCache<ApprovalGroup>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalGroupStore, cacheValue: cache.TtlCache<ApprovalGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalGroup | undefined {
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

  save(item: ApprovalGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalGroup[] {
    return this.inner.list();
  }
}

export function newCachedApprovalGroupStore(inner: ApprovalGroupStore, ttl: number, clockValue: clock.Clock): ApprovalGroupStore {
  return new CachedApprovalGroupStore(inner, cache.newTtlCache<ApprovalGroup>(256, ttl, clockValue), 0, 0);
}

/** Selects approval groups. Empty fields match all. */
export class ApprovalGroupQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalGroup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalGroup[]): ApprovalGroup[] {
    const matched = collections.filter(items, (candidate: ApprovalGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalGroups(store: ApprovalGroupStore, query: ApprovalGroupQuery): ApprovalGroup[] {
  return query.apply(store.list());
}
