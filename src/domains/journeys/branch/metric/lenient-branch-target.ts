import * as text from "../../../../kit/text.js";

/** Where a lenient branch target is in its life cycle. */
export type LenientBranchTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient branch target as the branch team keeps it. */
export class LenientBranchTarget {
  code: string;
  label: string;
  phone: string;
  journeyId: string;
  category: string;
  amount: number;
  status: LenientBranchTargetStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    journeyId: string,
    category: string,
    amount: number,
    status: LenientBranchTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.journeyId = journeyId;
    this.category = category;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientBranchTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBranchTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient branch target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient branch target"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): LenientBranchTarget {
    return new LenientBranchTarget(
      this.code,
      this.label,
      this.phone,
      this.journeyId,
      this.category,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient branch target in status requested. */
export function newLenientBranchTarget(code: string, label: string): LenientBranchTarget {
  return new LenientBranchTarget(code, label, "", "", "", 0, "requested");
}
