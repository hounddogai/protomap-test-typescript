/**
 * The primary approval snapshot records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary approval snapshot is in its life cycle. */
export type PrimaryApprovalSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary approval snapshot, with what the planners need to act on it. */
export class PrimaryApprovalSnapshot {
  code: string;
  title: string;
  audienceId: string;
  attempts: number;
  sendAt: number;
  checksum: string;
  reviewer: string;
  currency: string;
  status: PrimaryApprovalSnapshotStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    attempts: number,
    sendAt: number,
    checksum: string,
    reviewer: string,
    currency: string,
    status: PrimaryApprovalSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.currency = currency;
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

  canMoveTo(next: PrimaryApprovalSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryApprovalSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary approval snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.attempts - this.sendAt) * 100) / 100;
  }

  copy(): PrimaryApprovalSnapshot {
    return new PrimaryApprovalSnapshot(
      this.code,
      this.title,
      this.audienceId,
      this.attempts,
      this.sendAt,
      this.checksum,
      this.reviewer,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary approval snapshot in status draft. */
export function newPrimaryApprovalSnapshot(code: string, title: string): PrimaryApprovalSnapshot {
  return new PrimaryApprovalSnapshot(code, title, "", 0, 0, "", "", "", "draft");
}
