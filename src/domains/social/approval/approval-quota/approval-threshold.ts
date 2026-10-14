import * as text from "../../../../kit/text.js";

/** Where a approval threshold is in its life cycle. */
export type ApprovalThresholdStatus = "created" | "validated" | "published" | "retired";

/** The record of a approval threshold and its current status. */
export class ApprovalThreshold {
  code: string;
  name: string;
  graceDays: number;
  channel: string;
  rate: number;
  status: ApprovalThresholdStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    channel: string,
    rate: number,
    status: ApprovalThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.channel = channel;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ApprovalThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval threshold"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.graceDays + this.rate) * 100) / 100;
  }

  copy(): ApprovalThreshold {
    return new ApprovalThreshold(this.code, this.name, this.graceDays, this.channel, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a approval threshold in status created. */
export function newApprovalThreshold(code: string, name: string): ApprovalThreshold {
  return new ApprovalThreshold(code, name, 0, "", 0, "created");
}
