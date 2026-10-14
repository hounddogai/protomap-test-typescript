import * as text from "../../../../kit/text.js";

/** Where a approval adjustment is in its life cycle. */
export type ApprovalAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a approval adjustment and its current status. */
export class ApprovalAdjustment {
  code: string;
  title: string;
  locale: string;
  journeyId: string;
  impressions: number;
  discount: number;
  cohort: string;
  status: ApprovalAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    journeyId: string,
    impressions: number,
    discount: number,
    cohort: string,
    status: ApprovalAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.journeyId = journeyId;
    this.impressions = impressions;
    this.discount = discount;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval adjustment"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.discount - this.impressions) * 100) / 100;
  }

  copy(): ApprovalAdjustment {
    return new ApprovalAdjustment(
      this.code,
      this.title,
      this.locale,
      this.journeyId,
      this.impressions,
      this.discount,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a approval adjustment in status new. */
export function newApprovalAdjustment(code: string, title: string): ApprovalAdjustment {
  return new ApprovalAdjustment(code, title, "", "", 0, 0, "", "new");
}
