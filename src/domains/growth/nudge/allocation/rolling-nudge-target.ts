import * as text from "../../../../kit/text.js";

/** Where a rolling nudge target is in its life cycle. */
export type RollingNudgeTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling nudge target. Its code is unique within a tenant. */
export class RollingNudgeTarget {
  code: string;
  title: string;
  createdAt: number;
  sendAt: number;
  threshold: number;
  bid: number;
  pinned: boolean;
  attempts: number;
  archived: boolean;
  openRate: number;
  status: RollingNudgeTargetStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    sendAt: number,
    threshold: number,
    bid: number,
    pinned: boolean,
    attempts: number,
    archived: boolean,
    openRate: number,
    status: RollingNudgeTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.bid = bid;
    this.pinned = pinned;
    this.attempts = attempts;
    this.archived = archived;
    this.openRate = openRate;
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

  canMoveTo(next: RollingNudgeTargetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingNudgeTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netVolume(): number {
    return Math.round(this.threshold * this.openRate * 100) / 100;
  }

  copy(): RollingNudgeTarget {
    return new RollingNudgeTarget(
      this.code,
      this.title,
      this.createdAt,
      this.sendAt,
      this.threshold,
      this.bid,
      this.pinned,
      this.attempts,
      this.archived,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling nudge target in status open. */
export function newRollingNudgeTarget(code: string, title: string): RollingNudgeTarget {
  return new RollingNudgeTarget(code, title, 0, 0, 0, 0, false, 0, false, 0, "open");
}
