/**
 * The post notice records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post notice is in its life cycle. */
export type PostNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a post notice and its current status. */
export class PostNotice {
  code: string;
  title: string;
  limit: number;
  quantity: number;
  endsAt: number;
  region: string;
  attributes: Map<string, string>;
  description: string;
  locale: string;
  rate: number;
  status: PostNoticeStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    quantity: number,
    endsAt: number,
    region: string,
    attributes: Map<string, string>,
    description: string,
    locale: string,
    rate: number,
    status: PostNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.quantity = quantity;
    this.endsAt = endsAt;
    this.region = region;
    this.attributes = attributes;
    this.description = description;
    this.locale = locale;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.rate - this.limit) * 100) / 100;
  }

  copy(): PostNotice {
    return new PostNotice(
      this.code,
      this.title,
      this.limit,
      this.quantity,
      this.endsAt,
      this.region,
      this.attributes,
      this.description,
      this.locale,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a post notice in status new. */
export function newPostNotice(code: string, title: string): PostNotice {
  return new PostNotice(code, title, 0, 0, 0, "", new Map<string, string>(), "", "", 0, "new");
}
