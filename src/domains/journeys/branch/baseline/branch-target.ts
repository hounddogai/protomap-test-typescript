import * as text from "../../../../kit/text.js";

/** Where a branch target is in its life cycle. */
export type BranchTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a branch target and its current status. */
export class BranchTarget {
  code: string;
  label: string;
  summary: string;
  region: string;
  bid: number;
  durationMinutes: number;
  locale: string;
  phone: string;
  status: BranchTargetStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    region: string,
    bid: number,
    durationMinutes: number,
    locale: string,
    phone: string,
    status: BranchTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.region = region;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.phone = phone;
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

  canMoveTo(next: BranchTargetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round(this.bid * this.durationMinutes * 100) / 100;
  }

  copy(): BranchTarget {
    return new BranchTarget(
      this.code,
      this.label,
      this.summary,
      this.region,
      this.bid,
      this.durationMinutes,
      this.locale,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a branch target in status open. */
export function newBranchTarget(code: string, label: string): BranchTarget {
  return new BranchTarget(code, label, "", "", 0, 0, "", "", "open");
}
