import * as text from "../../../../kit/text.js";

/** Where a pending double opt in rollup is in its life cycle. */
export type PendingDoubleOptInRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending double opt in rollup and its current status. */
export class PendingDoubleOptInRollup {
  code: string;
  title: string;
  endsAt: number;
  conversionRate: number;
  attempts: number;
  checksum: string;
  cohort: string;
  channel: string;
  updatedAt: number;
  budget: number;
  status: PendingDoubleOptInRollupStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    conversionRate: number,
    attempts: number,
    checksum: string,
    cohort: string,
    channel: string,
    updatedAt: number,
    budget: number,
    status: PendingDoubleOptInRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.checksum = checksum;
    this.cohort = cohort;
    this.channel = channel;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: PendingDoubleOptInRollupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "reopened":
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingDoubleOptInRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending double opt in rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round((this.endsAt + this.budget) * 100) / 100;
  }

  copy(): PendingDoubleOptInRollup {
    return new PendingDoubleOptInRollup(
      this.code,
      this.title,
      this.endsAt,
      this.conversionRate,
      this.attempts,
      this.checksum,
      this.cohort,
      this.channel,
      this.updatedAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending double opt in rollup in status open. */
export function newPendingDoubleOptInRollup(code: string, title: string): PendingDoubleOptInRollup {
  return new PendingDoubleOptInRollup(code, title, 0, 0, 0, "", "", "", 0, 0, "open");
}
