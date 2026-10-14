/**
 * The approval score records of social's approval work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval score is in its life cycle. */
export type ApprovalScoreStatus = "created" | "validated" | "published" | "retired";

/** A approval score as the approval team keeps it. */
export class ApprovalScore {
  code: string;
  title: string;
  audienceId: string;
  locale: string;
  impressions: number;
  amount: number;
  quantity: number;
  timezone: string;
  durationMinutes: number;
  status: ApprovalScoreStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    locale: string,
    impressions: number,
    amount: number,
    quantity: number,
    timezone: string,
    durationMinutes: number,
    status: ApprovalScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.locale = locale;
    this.impressions = impressions;
    this.amount = amount;
    this.quantity = quantity;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ApprovalScoreStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
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

  moveTo(next: ApprovalScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.amount + this.impressions) * 100) / 100;
  }

  copy(): ApprovalScore {
    return new ApprovalScore(
      this.code,
      this.title,
      this.audienceId,
      this.locale,
      this.impressions,
      this.amount,
      this.quantity,
      this.timezone,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a approval score in status created. */
export function newApprovalScore(code: string, title: string): ApprovalScore {
  return new ApprovalScore(code, title, "", "", 0, 0, 0, "", 0, "created");
}
