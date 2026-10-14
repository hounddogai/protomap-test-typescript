/**
 * The nudge draft records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge draft is in its life cycle. */
export type NudgeDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a nudge draft and its current status. */
export class NudgeDraft {
  code: string;
  title: string;
  rate: number;
  minimum: number;
  budget: number;
  score: number;
  audienceId: string;
  status: NudgeDraftStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    minimum: number,
    budget: number,
    score: number,
    audienceId: string,
    status: NudgeDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.minimum = minimum;
    this.budget = budget;
    this.score = score;
    this.audienceId = audienceId;
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

  canMoveTo(next: NudgeDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"nudge draft"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.score * this.budget * 100) / 100;
  }

  copy(): NudgeDraft {
    return new NudgeDraft(
      this.code,
      this.title,
      this.rate,
      this.minimum,
      this.budget,
      this.score,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a nudge draft in status open. */
export function newNudgeDraft(code: string, title: string): NudgeDraft {
  return new NudgeDraft(code, title, 0, 0, 0, 0, "", "open");
}
