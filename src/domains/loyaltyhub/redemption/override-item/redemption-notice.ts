import * as text from "../../../../kit/text.js";

/** Where a redemption notice is in its life cycle. */
export type RedemptionNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a redemption notice and its current status. */
export class RedemptionNotice {
  code: string;
  name: string;
  version: number;
  pinned: boolean;
  sequence: number;
  ceiling: number;
  openRate: number;
  status: RedemptionNoticeStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    pinned: boolean,
    sequence: number,
    ceiling: number,
    openRate: number,
    status: RedemptionNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.pinned = pinned;
    this.sequence = sequence;
    this.ceiling = ceiling;
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

  canMoveTo(next: RedemptionNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RedemptionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"redemption notice"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.version + this.sequence) * 100) / 100;
  }

  copy(): RedemptionNotice {
    return new RedemptionNotice(
      this.code,
      this.name,
      this.version,
      this.pinned,
      this.sequence,
      this.ceiling,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a redemption notice in status open. */
export function newRedemptionNotice(code: string, name: string): RedemptionNotice {
  return new RedemptionNotice(code, name, 0, false, 0, 0, 0, "open");
}
