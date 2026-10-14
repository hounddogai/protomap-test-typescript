/**
 * The mention group records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention group is in its life cycle. */
export type MentionGroupStatus = "created" | "validated" | "published" | "retired";

/** One mention group, with what the planners need to act on it. */
export class MentionGroup {
  code: string;
  title: string;
  pinned: boolean;
  label: string;
  graceDays: number;
  locale: string;
  margin: number;
  segment: string;
  bid: number;
  status: MentionGroupStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    label: string,
    graceDays: number,
    locale: string,
    margin: number,
    segment: string,
    bid: number,
    status: MentionGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.label = label;
    this.graceDays = graceDays;
    this.locale = locale;
    this.margin = margin;
    this.segment = segment;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionGroupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: MentionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"mention group"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.margin * this.graceDays * 100) / 100;
  }

  copy(): MentionGroup {
    return new MentionGroup(
      this.code,
      this.title,
      this.pinned,
      this.label,
      this.graceDays,
      this.locale,
      this.margin,
      this.segment,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a mention group in status created. */
export function newMentionGroup(code: string, title: string): MentionGroup {
  return new MentionGroup(code, title, false, "", 0, "", 0, "", 0, "created");
}
