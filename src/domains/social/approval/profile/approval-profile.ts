/**
 * The approval profile records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval profile is in its life cycle. */
export type ApprovalProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A approval profile as the approval team keeps it. */
export class ApprovalProfile {
  code: string;
  label: string;
  minimum: number;
  locale: string;
  ceiling: number;
  priority: number;
  conversionRate: number;
  windowDays: number;
  weight: number;
  currency: string;
  createdAt: number;
  status: ApprovalProfileStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    locale: string,
    ceiling: number,
    priority: number,
    conversionRate: number,
    windowDays: number,
    weight: number,
    currency: string,
    createdAt: number,
    status: ApprovalProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.locale = locale;
    this.ceiling = ceiling;
    this.priority = priority;
    this.conversionRate = conversionRate;
    this.windowDays = windowDays;
    this.weight = weight;
    this.currency = currency;
    this.createdAt = createdAt;
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

  canMoveTo(next: ApprovalProfileStatus): boolean {
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ApprovalProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"approval profile"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.createdAt - this.conversionRate) * 100) / 100;
  }

  copy(): ApprovalProfile {
    return new ApprovalProfile(
      this.code,
      this.label,
      this.minimum,
      this.locale,
      this.ceiling,
      this.priority,
      this.conversionRate,
      this.windowDays,
      this.weight,
      this.currency,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a approval profile in status open. */
export function newApprovalProfile(code: string, label: string): ApprovalProfile {
  return new ApprovalProfile(code, label, 0, "", 0, 0, 0, 0, 0, "", 0, "open");
}
