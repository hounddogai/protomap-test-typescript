import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionProfile } from "./mention-profile.js";

/** Keeps mention profiles by code. */
export interface MentionProfileStore {
  find(code: string): MentionProfile | undefined;
  save(item: MentionProfile): void;
  remove(code: string): boolean;
  list(): MentionProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionProfileStore implements MentionProfileStore {
  items: Map<string, MentionProfile>;
  order: string[];

  constructor(items: Map<string, MentionProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionProfile): void {
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

  list(): MentionProfile[] {
    const out: MentionProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionProfileStore(): MentionProfileStore {
  return new MemoryMentionProfileStore(new Map<string, MentionProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionProfileStore implements MentionProfileStore {
  inner: MentionProfileStore;
  cache: cache.TtlCache<MentionProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionProfileStore,
    cacheValue: cache.TtlCache<MentionProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionProfile | undefined {
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

  save(item: MentionProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionProfile[] {
    return this.inner.list();
  }
}

export function newCachedMentionProfileStore(inner: MentionProfileStore, ttl: number, clockValue: clock.Clock): MentionProfileStore {
  return new CachedMentionProfileStore(inner, cache.newTtlCache<MentionProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects mention profiles. Empty fields match all. */
export class MentionProfileQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionProfile[]): MentionProfile[] {
    const matched = collections.filter(items, (candidate: MentionProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionProfiles(store: MentionProfileStore, query: MentionProfileQuery): MentionProfile[] {
  return query.apply(store.list());
}
