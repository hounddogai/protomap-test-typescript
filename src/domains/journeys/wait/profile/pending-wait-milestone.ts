import * as text from "../../../../kit/text.js";

/** Where a pending wait milestone is in its life cycle. */
export type PendingWaitMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending wait milestone and its current status. */
export class PendingWaitMilestone {
  code: string;
  title: string;
  locale: string;
  openRate: number;
  expiresAt: number;
  clicks: number;
  status: PendingWaitMilestoneStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    openRate: number,
    expiresAt: number,
    clicks: number,
    status: PendingWaitMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.openRate = openRate;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
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

  canMoveTo(next: PendingWaitMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingWaitMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending wait milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.openRate + this.clicks) * 100) / 100;
  }

  copy(): PendingWaitMilestone {
    return new PendingWaitMilestone(
      this.code,
      this.title,
      this.locale,
      this.openRate,
      this.expiresAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending wait milestone in status open. */
export function newPendingWaitMilestone(code: string, title: string): PendingWaitMilestone {
  return new PendingWaitMilestone(code, title, "", 0, 0, 0, "open");
}
