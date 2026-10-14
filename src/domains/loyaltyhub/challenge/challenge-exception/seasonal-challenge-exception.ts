/**
 * The seasonal challenge exception records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal challenge exception is in its life cycle. */
export type SeasonalChallengeExceptionStatus = "created" | "validated" | "published" | "retired";

/** One seasonal challenge exception, with what the planners need to act on it. */
export class SeasonalChallengeException {
  code: string;
  name: string;
  approved: boolean;
  attempts: number;
  startsAt: number;
  status: SeasonalChallengeExceptionStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    attempts: number,
    startsAt: number,
    status: SeasonalChallengeExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.attempts = attempts;
    this.startsAt = startsAt;
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

  canMoveTo(next: SeasonalChallengeExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalChallengeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal challenge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"seasonal challenge exception"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt - this.attempts) * 100) / 100;
  }

  copy(): SeasonalChallengeException {
    return new SeasonalChallengeException(
      this.code,
      this.name,
      this.approved,
      this.attempts,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal challenge exception in status created. */
export function newSeasonalChallengeException(code: string, name: string): SeasonalChallengeException {
  return new SeasonalChallengeException(code, name, false, 0, 0, "created");
}
