import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionDraft } from "./mention-draft.js";

/** Keeps mention drafts by code. */
export interface MentionDraftStore {
  find(code: string): MentionDraft | undefined;
  save(item: MentionDraft): void;
  remove(code: string): boolean;
  list(): MentionDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionDraftStore implements MentionDraftStore {
  items: Map<string, MentionDraft>;
  order: string[];

  constructor(items: Map<string, MentionDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionDraft): void {
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

  list(): MentionDraft[] {
    const out: MentionDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionDraftStore(): MentionDraftStore {
  return new MemoryMentionDraftStore(new Map<string, MentionDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionDraftStore implements MentionDraftStore {
  inner: MentionDraftStore;
  cache: cache.TtlCache<MentionDraft>;
  hits: number;
  misses: number;

  constructor(inner: MentionDraftStore, cacheValue: cache.TtlCache<MentionDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionDraft | undefined {
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

  save(item: MentionDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionDraft[] {
    return this.inner.list();
  }
}

export function newCachedMentionDraftStore(inner: MentionDraftStore, ttl: number, clockValue: clock.Clock): MentionDraftStore {
  return new CachedMentionDraftStore(inner, cache.newTtlCache<MentionDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects mention drafts. Empty fields match all. */
export class MentionDraftQuery {
  segment: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCapacity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionDraft): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionDraft[]): MentionDraft[] {
    const matched = collections.filter(items, (candidate: MentionDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionDrafts(store: MentionDraftStore, query: MentionDraftQuery): MentionDraft[] {
  return query.apply(store.list());
}
