import * as text from "../../../../kit/text.js";

/** Where a pending approval bundle is in its life cycle. */
export type PendingApprovalBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending approval bundle as the approval team keeps it. */
export class PendingApprovalBundle {
  code: string;
  title: string;
  cohort: string;
  contactEmail: string;
  priority: number;
  score: number;
  approved: boolean;
  status: PendingApprovalBundleStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    contactEmail: string,
    priority: number,
    score: number,
    approved: boolean,
    status: PendingApprovalBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.score = score;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingApprovalBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingApprovalBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending approval bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending approval bundle"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.priority + this.score) * 100) / 100;
  }

  copy(): PendingApprovalBundle {
    return new PendingApprovalBundle(
      this.code,
      this.title,
      this.cohort,
      this.contactEmail,
      this.priority,
      this.score,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending approval bundle in status idle. */
export function newPendingApprovalBundle(code: string, title: string): PendingApprovalBundle {
  return new PendingApprovalBundle(code, title, "", "", 0, 0, false, "idle");
}
