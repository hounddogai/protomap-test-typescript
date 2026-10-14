/**
 * The mention rollup records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention rollup is in its life cycle. */
export type MentionRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a mention rollup and its current status. */
export class MentionRollup {
  code: string;
  title: string;
  openRate: number;
  locale: string;
  minimum: number;
  channel: string;
  updatedAt: number;
  archived: boolean;
  category: string;
  status: MentionRollupStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    locale: string,
    minimum: number,
    channel: string,
    updatedAt: number,
    archived: boolean,
    category: string,
    status: MentionRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.locale = locale;
    this.minimum = minimum;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.archived = archived;
    this.category = category;
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

  canMoveTo(next: MentionRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: MentionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.openRate + this.minimum) * 100) / 100;
  }

  copy(): MentionRollup {
    return new MentionRollup(
      this.code,
      this.title,
      this.openRate,
      this.locale,
      this.minimum,
      this.channel,
      this.updatedAt,
      this.archived,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a mention rollup in status draft. */
export function newMentionRollup(code: string, title: string): MentionRollup {
  return new MentionRollup(code, title, 0, "", 0, "", 0, false, "", "draft");
}
