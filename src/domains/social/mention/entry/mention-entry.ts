/**
 * The mention entry records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention entry is in its life cycle. */
export type MentionEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A mention entry. Its code is unique within a tenant. */
export class MentionEntry {
  code: string;
  title: string;
  ceiling: number;
  clicks: number;
  rate: number;
  windowDays: number;
  variant: string;
  weight: number;
  status: MentionEntryStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    clicks: number,
    rate: number,
    windowDays: number,
    variant: string,
    weight: number,
    status: MentionEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.rate = rate;
    this.windowDays = windowDays;
    this.variant = variant;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.ceiling + this.windowDays) * 100) / 100;
  }

  copy(): MentionEntry {
    return new MentionEntry(
      this.code,
      this.title,
      this.ceiling,
      this.clicks,
      this.rate,
      this.windowDays,
      this.variant,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a mention entry in status open. */
export function newMentionEntry(code: string, title: string): MentionEntry {
  return new MentionEntry(code, title, 0, 0, 0, 0, "", 0, "open");
}
