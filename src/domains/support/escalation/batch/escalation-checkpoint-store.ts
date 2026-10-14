import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationCheckpoint } from "./escalation-checkpoint.js";

/** Keeps escalation checkpoints by code. */
export interface EscalationCheckpointStore {
  find(code: string): EscalationCheckpoint | undefined;
  save(item: EscalationCheckpoint): void;
  remove(code: string): boolean;
  list(): EscalationCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationCheckpointStore implements EscalationCheckpointStore {
  items: Map<string, EscalationCheckpoint>;
  order: string[];

  constructor(items: Map<string, EscalationCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationCheckpoint): void {
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

  list(): EscalationCheckpoint[] {
    const out: EscalationCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationCheckpointStore(): EscalationCheckpointStore {
  return new MemoryEscalationCheckpointStore(new Map<string, EscalationCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationCheckpointStore implements EscalationCheckpointStore {
  inner: EscalationCheckpointStore;
  cache: cache.TtlCache<EscalationCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationCheckpointStore,
    cacheValue: cache.TtlCache<EscalationCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationCheckpoint | undefined {
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

  save(item: EscalationCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedEscalationCheckpointStore(inner: EscalationCheckpointStore, ttl: number, clockValue: clock.Clock): EscalationCheckpointStore {
  return new CachedEscalationCheckpointStore(
    inner,
    cache.newTtlCache<EscalationCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects escalation checkpoints. Empty fields match all. */
export class EscalationCheckpointQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationCheckpoint[]): EscalationCheckpoint[] {
    const matched = collections.filter(items, (candidate: EscalationCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationCheckpoints(store: EscalationCheckpointStore, query: EscalationCheckpointQuery): EscalationCheckpoint[] {
  return query.apply(store.list());
}
