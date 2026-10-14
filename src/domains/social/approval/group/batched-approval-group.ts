import * as text from "../../../../kit/text.js";

/** Where a batched approval group is in its life cycle. */
export type BatchedApprovalGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a batched approval group and its current status. */
export class BatchedApprovalGroup {
  code: string;
  name: string;
  journeyId: string;
  locale: string;
  contactEmail: string;
  priority: number;
  graceDays: number;
  utmSource: string;
  maximum: number;
  status: BatchedApprovalGroupStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    locale: string,
    contactEmail: string,
    priority: number,
    graceDays: number,
    utmSource: string,
    maximum: number,
    status: BatchedApprovalGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.graceDays = graceDays;
    this.utmSource = utmSource;
    this.maximum = maximum;
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

  canMoveTo(next: BatchedApprovalGroupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
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

  moveTo(next: BatchedApprovalGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched approval group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched approval group"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.graceDays + this.priority) * 100) / 100;
  }

  copy(): BatchedApprovalGroup {
    return new BatchedApprovalGroup(
      this.code,
      this.name,
      this.journeyId,
      this.locale,
      this.contactEmail,
      this.priority,
      this.graceDays,
      this.utmSource,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched approval group in status open. */
export function newBatchedApprovalGroup(code: string, name: string): BatchedApprovalGroup {
  return new BatchedApprovalGroup(code, name, "", "", "", 0, 0, "", 0, "open");
}
