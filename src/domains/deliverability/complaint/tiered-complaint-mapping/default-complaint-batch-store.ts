import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultComplaintBatch } from "./default-complaint-batch.js";

/** Keeps default complaint batches by code. */
export interface DefaultComplaintBatchStore {
  find(code: string): DefaultComplaintBatch | undefined;
  save(item: DefaultComplaintBatch): void;
  remove(code: string): boolean;
  list(): DefaultComplaintBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultComplaintBatchStore implements DefaultComplaintBatchStore {
  items: Map<string, DefaultComplaintBatch>;
  order: string[];

  constructor(items: Map<string, DefaultComplaintBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultComplaintBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultComplaintBatch): void {
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

  list(): DefaultComplaintBatch[] {
    const out: DefaultComplaintBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultComplaintBatchStore(): DefaultComplaintBatchStore {
  return new MemoryDefaultComplaintBatchStore(new Map<string, DefaultComplaintBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultComplaintBatchStore implements DefaultComplaintBatchStore {
  inner: DefaultComplaintBatchStore;
  cache: cache.TtlCache<DefaultComplaintBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultComplaintBatchStore,
    cacheValue: cache.TtlCache<DefaultComplaintBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultComplaintBatch | undefined {
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

  save(item: DefaultComplaintBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultComplaintBatch[] {
    return this.inner.list();
  }
}

export function newCachedDefaultComplaintBatchStore(inner: DefaultComplaintBatchStore, ttl: number, clockValue: clock.Clock): DefaultComplaintBatchStore {
  return new CachedDefaultComplaintBatchStore(
    inner,
    cache.newTtlCache<DefaultComplaintBatch>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default complaint batches. Empty fields match all. */
export class DefaultComplaintBatchQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultComplaintBatch): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultComplaintBatch[]): DefaultComplaintBatch[] {
    const matched = collections.filter(items, (candidate: DefaultComplaintBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultComplaintBatches(store: DefaultComplaintBatchStore, query: DefaultComplaintBatchQuery): DefaultComplaintBatch[] {
  return query.apply(store.list());
}
