/**
 * The capped streak profile records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped streak profile is in its life cycle. */
export type CappedStreakProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One capped streak profile, with what the planners need to act on it. */
export class CappedStreakProfile {
  code: string;
  label: string;
  locale: string;
  floorValue: number;
  archived: boolean;
  minimum: number;
  expiresAt: number;
  score: number;
  sendAt: number;
  budget: number;
  status: CappedStreakProfileStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    floorValue: number,
    archived: boolean,
    minimum: number,
    expiresAt: number,
    score: number,
    sendAt: number,
    budget: number,
    status: CappedStreakProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.floorValue = floorValue;
    this.archived = archived;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.score = score;
    this.sendAt = sendAt;
    this.budget = budget;
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

  canMoveTo(next: CappedStreakProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: CappedStreakProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped streak profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.score - this.sendAt) * 100) / 100;
  }

  copy(): CappedStreakProfile {
    return new CappedStreakProfile(
      this.code,
      this.label,
      this.locale,
      this.floorValue,
      this.archived,
      this.minimum,
      this.expiresAt,
      this.score,
      this.sendAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped streak profile in status open. */
export function newCappedStreakProfile(code: string, label: string): CappedStreakProfile {
  return new CappedStreakProfile(code, label, "", 0, false, 0, 0, 0, 0, 0, "open");
}
