import * as text from "../../../../kit/text.js";

/** Where a rolling challenge threshold is in its life cycle. */
export type RollingChallengeThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling challenge threshold as the challenge team keeps it. */
export class RollingChallengeThreshold {
  code: string;
  title: string;
  timezone: string;
  locale: string;
  approved: boolean;
  batchSize: number;
  description: string;
  attempts: number;
  sequence: number;
  budget: number;
  region: string;
  status: RollingChallengeThresholdStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    locale: string,
    approved: boolean,
    batchSize: number,
    description: string,
    attempts: number,
    sequence: number,
    budget: number,
    region: string,
    status: RollingChallengeThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.locale = locale;
    this.approved = approved;
    this.batchSize = batchSize;
    this.description = description;
    this.attempts = attempts;
    this.sequence = sequence;
    this.budget = budget;
    this.region = region;
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

  canMoveTo(next: RollingChallengeThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: RollingChallengeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling challenge threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.batchSize + this.sequence) * 100) / 100;
  }

  copy(): RollingChallengeThreshold {
    return new RollingChallengeThreshold(
      this.code,
      this.title,
      this.timezone,
      this.locale,
      this.approved,
      this.batchSize,
      this.description,
      this.attempts,
      this.sequence,
      this.budget,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling challenge threshold in status open. */
export function newRollingChallengeThreshold(code: string, title: string): RollingChallengeThreshold {
  return new RollingChallengeThreshold(code, title, "", "", false, 0, "", 0, 0, 0, "", "open");
}
