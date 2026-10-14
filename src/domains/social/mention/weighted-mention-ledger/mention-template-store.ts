import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionTemplate } from "./mention-template.js";

/** Keeps mention templates by code. */
export interface MentionTemplateStore {
  find(code: string): MentionTemplate | undefined;
  save(item: MentionTemplate): void;
  remove(code: string): boolean;
  list(): MentionTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionTemplateStore implements MentionTemplateStore {
  items: Map<string, MentionTemplate>;
  order: string[];

  constructor(items: Map<string, MentionTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionTemplate): void {
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

  list(): MentionTemplate[] {
    const out: MentionTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionTemplateStore(): MentionTemplateStore {
  return new MemoryMentionTemplateStore(new Map<string, MentionTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionTemplateStore implements MentionTemplateStore {
  inner: MentionTemplateStore;
  cache: cache.TtlCache<MentionTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionTemplateStore,
    cacheValue: cache.TtlCache<MentionTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionTemplate | undefined {
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

  save(item: MentionTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionTemplate[] {
    return this.inner.list();
  }
}

export function newCachedMentionTemplateStore(inner: MentionTemplateStore, ttl: number, clockValue: clock.Clock): MentionTemplateStore {
  return new CachedMentionTemplateStore(inner, cache.newTtlCache<MentionTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention templates. Empty fields match all. */
export class MentionTemplateQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionTemplate[]): MentionTemplate[] {
    const matched = collections.filter(items, (candidate: MentionTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionTemplates(store: MentionTemplateStore, query: MentionTemplateQuery): MentionTemplate[] {
  return query.apply(store.list());
}
