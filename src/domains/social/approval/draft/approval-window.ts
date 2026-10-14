import * as text from "../../../../kit/text.js";

/** Where a approval window is in its life cycle. */
export type ApprovalWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a approval window and its current status. */
export class ApprovalWindow {
  code: string;
  title: string;
  margin: number;
  score: number;
  retries: number;
  ownerId: string;
  status: ApprovalWindowStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    score: number,
    retries: number,
    ownerId: string,
    status: ApprovalWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.score = score;
    this.retries = retries;
    this.ownerId = ownerId;
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

  canMoveTo(next: ApprovalWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ApprovalWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.retries + this.margin) * 100) / 100;
  }

  copy(): ApprovalWindow {
    return new ApprovalWindow(this.code, this.title, this.margin, this.score, this.retries, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a approval window in status open. */
export function newApprovalWindow(code: string, title: string): ApprovalWindow {
  return new ApprovalWindow(code, title, 0, 0, 0, "", "open");
}
