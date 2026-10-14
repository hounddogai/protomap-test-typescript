import * as text from "../../../../kit/text.js";

/** Where a branch profile is in its life cycle. */
export type BranchProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A branch profile as the branch team keeps it. */
export class BranchProfile {
  code: string;
  title: string;
  retries: number;
  category: string;
  externalRef: string;
  margin: number;
  status: BranchProfileStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    category: string,
    externalRef: string,
    margin: number,
    status: BranchProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.category = category;
    this.externalRef = externalRef;
    this.margin = margin;
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

  canMoveTo(next: BranchProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BranchProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.retries + this.margin) * 100) / 100;
  }

  copy(): BranchProfile {
    return new BranchProfile(
      this.code,
      this.title,
      this.retries,
      this.category,
      this.externalRef,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a branch profile in status proposed. */
export function newBranchProfile(code: string, title: string): BranchProfile {
  return new BranchProfile(code, title, 0, "", "", 0, "proposed");
}
