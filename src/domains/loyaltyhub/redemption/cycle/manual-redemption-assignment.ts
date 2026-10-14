import * as text from "../../../../kit/text.js";

/** Where a manual redemption assignment is in its life cycle. */
export type ManualRedemptionAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual redemption assignment as the redemption team keeps it. */
export class ManualRedemptionAssignment {
  code: string;
  label: string;
  version: number;
  windowDays: number;
  sendAt: number;
  margin: number;
  status: ManualRedemptionAssignmentStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    windowDays: number,
    sendAt: number,
    margin: number,
    status: ManualRedemptionAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.windowDays = windowDays;
    this.sendAt = sendAt;
    this.margin = margin;
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

  canMoveTo(next: ManualRedemptionAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRedemptionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual redemption assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.version * this.margin * 100) / 100;
  }

  copy(): ManualRedemptionAssignment {
    return new ManualRedemptionAssignment(
      this.code,
      this.label,
      this.version,
      this.windowDays,
      this.sendAt,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual redemption assignment in status open. */
export function newManualRedemptionAssignment(code: string, label: string): ManualRedemptionAssignment {
  return new ManualRedemptionAssignment(code, label, 0, 0, 0, 0, "open");
}
