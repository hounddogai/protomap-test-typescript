import * as text from "../../../../kit/text.js";

/** Where a global fraud check summary is in its life cycle. */
export type GlobalFraudCheckSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global fraud check summary as the fraud check team keeps it. */
export class GlobalFraudCheckSummary {
  code: string;
  label: string;
  createdAt: number;
  journeyId: string;
  graceDays: number;
  checksum: string;
  reviewer: string;
  attempts: number;
  score: number;
  locale: string;
  status: GlobalFraudCheckSummaryStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    journeyId: string,
    graceDays: number,
    checksum: string,
    reviewer: string,
    attempts: number,
    score: number,
    locale: string,
    status: GlobalFraudCheckSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.graceDays = graceDays;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.attempts = attempts;
    this.score = score;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalFraudCheckSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFraudCheckSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global fraud check summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.createdAt - this.attempts) * 100) / 100;
  }

  copy(): GlobalFraudCheckSummary {
    return new GlobalFraudCheckSummary(
      this.code,
      this.label,
      this.createdAt,
      this.journeyId,
      this.graceDays,
      this.checksum,
      this.reviewer,
      this.attempts,
      this.score,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global fraud check summary in status draft. */
export function newGlobalFraudCheckSummary(code: string, label: string): GlobalFraudCheckSummary {
  return new GlobalFraudCheckSummary(code, label, 0, "", 0, "", "", 0, 0, "", "draft");
}
