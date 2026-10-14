/**
 * The pending approval audit records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending approval audit is in its life cycle. */
export type PendingApprovalAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending approval audit. Its code is unique within a tenant. */
export class PendingApprovalAudit {
  code: string;
  title: string;
  segment: string;
  sequence: number;
  pinned: boolean;
  channel: string;
  attempts: number;
  category: string;
  status: PendingApprovalAuditStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    sequence: number,
    pinned: boolean,
    channel: string,
    attempts: number,
    category: string,
    status: PendingApprovalAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.sequence = sequence;
    this.pinned = pinned;
    this.channel = channel;
    this.attempts = attempts;
    this.category = category;
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

  canMoveTo(next: PendingApprovalAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingApprovalAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending approval audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round((this.sequence + this.attempts) * 100) / 100;
  }

  copy(): PendingApprovalAudit {
    return new PendingApprovalAudit(
      this.code,
      this.title,
      this.segment,
      this.sequence,
      this.pinned,
      this.channel,
      this.attempts,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending approval audit in status open. */
export function newPendingApprovalAudit(code: string, title: string): PendingApprovalAudit {
  return new PendingApprovalAudit(code, title, "", 0, false, "", 0, "", "open");
}
