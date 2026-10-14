/**
 * The approval summary records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval summary is in its life cycle. */
export type ApprovalSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A approval summary. Its code is unique within a tenant. */
export class ApprovalSummary {
  code: string;
  title: string;
  locale: string;
  variant: string;
  durationMinutes: number;
  status: ApprovalSummaryStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    variant: string,
    durationMinutes: number,
    status: ApprovalSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.variant = variant;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ApprovalSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: ApprovalSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): ApprovalSummary {
    return new ApprovalSummary(this.code, this.title, this.locale, this.variant, this.durationMinutes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a approval summary in status open. */
export function newApprovalSummary(code: string, title: string): ApprovalSummary {
  return new ApprovalSummary(code, title, "", "", 0, "open");
}
