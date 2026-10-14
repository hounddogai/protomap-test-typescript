import * as text from "../../../../kit/text.js";

/** Where a tier exception is in its life cycle. */
export type TierExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tier exception, with what the planners need to act on it. */
export class TierException {
  code: string;
  label: string;
  budget: number;
  approved: boolean;
  retries: number;
  status: TierExceptionStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    approved: boolean,
    retries: number,
    status: TierExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.approved = approved;
    this.retries = retries;
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

  canMoveTo(next: TierExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tier exception"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.retries + this.budget) * 100) / 100;
  }

  copy(): TierException {
    return new TierException(this.code, this.label, this.budget, this.approved, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tier exception in status new. */
export function newTierException(code: string, label: string): TierException {
  return new TierException(code, label, 0, false, 0, "new");
}
