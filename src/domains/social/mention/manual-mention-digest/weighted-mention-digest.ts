/**
 * The weighted mention digest records of social's mention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted mention digest is in its life cycle. */
export type WeightedMentionDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One weighted mention digest, with what the planners need to act on it. */
export class WeightedMentionDigest {
  code: string;
  title: string;
  notes: string;
  ceiling: number;
  archived: boolean;
  status: WeightedMentionDigestStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    ceiling: number,
    archived: boolean,
    status: WeightedMentionDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.ceiling = ceiling;
    this.archived = archived;
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

  canMoveTo(next: WeightedMentionDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedMentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted mention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): WeightedMentionDigest {
    return new WeightedMentionDigest(this.code, this.title, this.notes, this.ceiling, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted mention digest in status open. */
export function newWeightedMentionDigest(code: string, title: string): WeightedMentionDigest {
  return new WeightedMentionDigest(code, title, "", 0, false, "open");
}
