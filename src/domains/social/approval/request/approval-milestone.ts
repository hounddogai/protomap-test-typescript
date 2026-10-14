import * as text from "../../../../kit/text.js";

/** Where a approval milestone is in its life cycle. */
export type ApprovalMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One approval milestone, with what the planners need to act on it. */
export class ApprovalMilestone {
  code: string;
  label: string;
  channel: string;
  expiresAt: number;
  sendAt: number;
  checksum: string;
  status: ApprovalMilestoneStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    expiresAt: number,
    sendAt: number,
    checksum: string,
    status: ApprovalMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.checksum = checksum;
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

  canMoveTo(next: ApprovalMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
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

  moveTo(next: ApprovalMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"approval milestone"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.sendAt - this.expiresAt) * 100) / 100;
  }

  copy(): ApprovalMilestone {
    return new ApprovalMilestone(
      this.code,
      this.label,
      this.channel,
      this.expiresAt,
      this.sendAt,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a approval milestone in status open. */
export function newApprovalMilestone(code: string, label: string): ApprovalMilestone {
  return new ApprovalMilestone(code, label, "", 0, 0, "", "open");
}
