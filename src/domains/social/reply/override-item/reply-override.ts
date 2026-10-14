/**
 * The reply override records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply override is in its life cycle. */
export type ReplyOverrideStatus = "created" | "validated" | "published" | "retired";

/** The record of a reply override and its current status. */
export class ReplyOverride {
  code: string;
  label: string;
  cohort: string;
  windowDays: number;
  description: string;
  title: string;
  reviewer: string;
  checksum: string;
  expiresAt: number;
  minimum: number;
  status: ReplyOverrideStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    windowDays: number,
    description: string,
    title: string,
    reviewer: string,
    checksum: string,
    expiresAt: number,
    minimum: number,
    status: ReplyOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.description = description;
    this.title = title;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.expiresAt = expiresAt;
    this.minimum = minimum;
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

  canMoveTo(next: ReplyOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ReplyOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round((this.expiresAt - this.windowDays) * 100) / 100;
  }

  copy(): ReplyOverride {
    return new ReplyOverride(
      this.code,
      this.label,
      this.cohort,
      this.windowDays,
      this.description,
      this.title,
      this.reviewer,
      this.checksum,
      this.expiresAt,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply override in status created. */
export function newReplyOverride(code: string, label: string): ReplyOverride {
  return new ReplyOverride(code, label, "", 0, "", "", "", "", 0, 0, "created");
}
