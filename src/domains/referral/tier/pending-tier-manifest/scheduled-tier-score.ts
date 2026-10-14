import * as text from "../../../../kit/text.js";

/** Where a scheduled tier score is in its life cycle. */
export type ScheduledTierScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled tier score as the tier team keeps it. */
export class ScheduledTierScore {
  code: string;
  label: string;
  timezone: string;
  title: string;
  contactEmail: string;
  segment: string;
  amount: number;
  status: ScheduledTierScoreStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    title: string,
    contactEmail: string,
    segment: string,
    amount: number,
    status: ScheduledTierScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.title = title;
    this.contactEmail = contactEmail;
    this.segment = segment;
    this.amount = amount;
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

  canMoveTo(next: ScheduledTierScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledTierScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled tier score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ScheduledTierScore {
    return new ScheduledTierScore(
      this.code,
      this.label,
      this.timezone,
      this.title,
      this.contactEmail,
      this.segment,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled tier score in status open. */
export function newScheduledTierScore(code: string, label: string): ScheduledTierScore {
  return new ScheduledTierScore(code, label, "", "", "", "", 0, "open");
}
