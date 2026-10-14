import * as text from "../../../../kit/text.js";

/** Where a scheduled reply claim is in its life cycle. */
export type ScheduledReplyClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** One scheduled reply claim, with what the planners need to act on it. */
export class ScheduledReplyClaim {
  code: string;
  label: string;
  reviewer: string;
  sendAt: number;
  ceiling: number;
  status: ScheduledReplyClaimStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    sendAt: number,
    ceiling: number,
    status: ScheduledReplyClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledReplyClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledReplyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reply claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled reply claim"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.sendAt - this.ceiling) * 100) / 100;
  }

  copy(): ScheduledReplyClaim {
    return new ScheduledReplyClaim(this.code, this.label, this.reviewer, this.sendAt, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled reply claim in status new. */
export function newScheduledReplyClaim(code: string, label: string): ScheduledReplyClaim {
  return new ScheduledReplyClaim(code, label, "", 0, 0, "new");
}
