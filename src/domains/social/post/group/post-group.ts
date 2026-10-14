/**
 * The post group records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post group is in its life cycle. */
export type PostGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A post group. Its code is unique within a tenant. */
export class PostGroup {
  code: string;
  title: string;
  minimum: number;
  channel: string;
  locale: string;
  status: PostGroupStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    channel: string,
    locale: string,
    status: PostGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.channel = channel;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PostGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): PostGroup {
    return new PostGroup(this.code, this.title, this.minimum, this.channel, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a post group in status draft. */
export function newPostGroup(code: string, title: string): PostGroup {
  return new PostGroup(code, title, 0, "", "", "draft");
}
