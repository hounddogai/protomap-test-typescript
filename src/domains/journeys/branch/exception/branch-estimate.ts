import * as text from "../../../../kit/text.js";

/** Where a branch estimate is in its life cycle. */
export type BranchEstimateStatus = "created" | "validated" | "published" | "retired";

/** One branch estimate, with what the planners need to act on it. */
export class BranchEstimate {
  code: string;
  title: string;
  version: number;
  variant: string;
  sendAt: number;
  floorValue: number;
  ratio: number;
  amount: number;
  status: BranchEstimateStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    variant: string,
    sendAt: number,
    floorValue: number,
    ratio: number,
    amount: number,
    status: BranchEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.variant = variant;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.ratio = ratio;
    this.amount = amount;
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

  canMoveTo(next: BranchEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"branch estimate"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.amount - this.sendAt) * 100) / 100;
  }

  copy(): BranchEstimate {
    return new BranchEstimate(
      this.code,
      this.title,
      this.version,
      this.variant,
      this.sendAt,
      this.floorValue,
      this.ratio,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch estimate in status created. */
export function newBranchEstimate(code: string, title: string): BranchEstimate {
  return new BranchEstimate(code, title, 0, "", 0, 0, 0, 0, "created");
}
