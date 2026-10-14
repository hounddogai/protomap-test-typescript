import * as text from "../../../../kit/text.js";

/** Where a pending branch baseline is in its life cycle. */
export type PendingBranchBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pending branch baseline, with what the planners need to act on it. */
export class PendingBranchBaseline {
  code: string;
  label: string;
  contactEmail: string;
  margin: number;
  quantity: number;
  updatedAt: number;
  status: PendingBranchBaselineStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    margin: number,
    quantity: number,
    updatedAt: number,
    status: PendingBranchBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.margin = margin;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingBranchBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingBranchBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending branch baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pending branch baseline"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.margin + this.quantity) * 100) / 100;
  }

  copy(): PendingBranchBaseline {
    return new PendingBranchBaseline(
      this.code,
      this.label,
      this.contactEmail,
      this.margin,
      this.quantity,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending branch baseline in status proposed. */
export function newPendingBranchBaseline(code: string, label: string): PendingBranchBaseline {
  return new PendingBranchBaseline(code, label, "", 0, 0, 0, "proposed");
}
