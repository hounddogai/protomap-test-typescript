/**
 * The pending retention audit records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending retention audit is in its life cycle. */
export type PendingRetentionAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pending retention audit, with what the planners need to act on it. */
export class PendingRetentionAudit {
  code: string;
  title: string;
  budget: number;
  reviewer: string;
  utmSource: string;
  status: PendingRetentionAuditStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    reviewer: string,
    utmSource: string,
    status: PendingRetentionAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingRetentionAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingRetentionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending retention audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PendingRetentionAudit {
    return new PendingRetentionAudit(this.code, this.title, this.budget, this.reviewer, this.utmSource, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending retention audit in status proposed. */
export function newPendingRetentionAudit(code: string, title: string): PendingRetentionAudit {
  return new PendingRetentionAudit(code, title, 0, "", "", "proposed");
}
