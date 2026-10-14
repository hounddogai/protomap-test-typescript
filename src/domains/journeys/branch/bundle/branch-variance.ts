import * as text from "../../../../kit/text.js";

/** Where a branch variance is in its life cycle. */
export type BranchVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A branch variance as the branch team keeps it. */
export class BranchVariance {
  code: string;
  label: string;
  approved: boolean;
  discount: number;
  createdAt: number;
  name: string;
  status: BranchVarianceStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    discount: number,
    createdAt: number,
    name: string,
    status: BranchVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.discount = discount;
    this.createdAt = createdAt;
    this.name = name;
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

  canMoveTo(next: BranchVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
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

  moveTo(next: BranchVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.discount + this.createdAt) * 100) / 100;
  }

  copy(): BranchVariance {
    return new BranchVariance(
      this.code,
      this.label,
      this.approved,
      this.discount,
      this.createdAt,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a branch variance in status open. */
export function newBranchVariance(code: string, label: string): BranchVariance {
  return new BranchVariance(code, label, false, 0, 0, "", "open");
}
