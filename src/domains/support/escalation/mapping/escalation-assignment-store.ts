import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationAssignment } from "./escalation-assignment.js";

/** Keeps escalation assignments by code. */
export interface EscalationAssignmentStore {
  find(code: string): EscalationAssignment | undefined;
  save(item: EscalationAssignment): void;
  remove(code: string): boolean;
  list(): EscalationAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationAssignmentStore implements EscalationAssignmentStore {
  items: Map<string, EscalationAssignment>;
  order: string[];

  constructor(items: Map<string, EscalationAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationAssignment): void {
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

  list(): EscalationAssignment[] {
    const out: EscalationAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationAssignmentStore(): EscalationAssignmentStore {
  return new MemoryEscalationAssignmentStore(new Map<string, EscalationAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationAssignmentStore implements EscalationAssignmentStore {
  inner: EscalationAssignmentStore;
  cache: cache.TtlCache<EscalationAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationAssignmentStore,
    cacheValue: cache.TtlCache<EscalationAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationAssignment | undefined {
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

  save(item: EscalationAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationAssignment[] {
    return this.inner.list();
  }
}

export function newCachedEscalationAssignmentStore(inner: EscalationAssignmentStore, ttl: number, clockValue: clock.Clock): EscalationAssignmentStore {
  return new CachedEscalationAssignmentStore(
    inner,
    cache.newTtlCache<EscalationAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects escalation assignments. Empty fields match all. */
export class EscalationAssignmentQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationAssignment[]): EscalationAssignment[] {
    const matched = collections.filter(items, (candidate: EscalationAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationAssignments(store: EscalationAssignmentStore, query: EscalationAssignmentQuery): EscalationAssignment[] {
  return query.apply(store.list());
}
