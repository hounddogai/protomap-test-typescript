import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalMilestone } from "./approval-milestone.js";

/** Keeps approval milestones by code. */
export interface ApprovalMilestoneStore {
  find(code: string): ApprovalMilestone | undefined;
  save(item: ApprovalMilestone): void;
  remove(code: string): boolean;
  list(): ApprovalMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalMilestoneStore implements ApprovalMilestoneStore {
  items: Map<string, ApprovalMilestone>;
  order: string[];

  constructor(items: Map<string, ApprovalMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalMilestone): void {
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

  list(): ApprovalMilestone[] {
    const out: ApprovalMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalMilestoneStore(): ApprovalMilestoneStore {
  return new MemoryApprovalMilestoneStore(new Map<string, ApprovalMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalMilestoneStore implements ApprovalMilestoneStore {
  inner: ApprovalMilestoneStore;
  cache: cache.TtlCache<ApprovalMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalMilestoneStore,
    cacheValue: cache.TtlCache<ApprovalMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalMilestone | undefined {
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

  save(item: ApprovalMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalMilestone[] {
    return this.inner.list();
  }
}

export function newCachedApprovalMilestoneStore(inner: ApprovalMilestoneStore, ttl: number, clockValue: clock.Clock): ApprovalMilestoneStore {
  return new CachedApprovalMilestoneStore(inner, cache.newTtlCache<ApprovalMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects approval milestones. Empty fields match all. */
export class ApprovalMilestoneQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalMilestone[]): ApprovalMilestone[] {
    const matched = collections.filter(items, (candidate: ApprovalMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalMilestones(store: ApprovalMilestoneStore, query: ApprovalMilestoneQuery): ApprovalMilestone[] {
  return query.apply(store.list());
}
