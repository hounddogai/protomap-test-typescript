import * as text from "../../../../kit/text.js";

/** Where a weighted challenge allocation is in its life cycle. */
export type WeightedChallengeAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted challenge allocation and its current status. */
export class WeightedChallengeAllocation {
  code: string;
  title: string;
  variant: string;
  sendAt: number;
  windowDays: number;
  status: WeightedChallengeAllocationStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    sendAt: number,
    windowDays: number,
    status: WeightedChallengeAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
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

  canMoveTo(next: WeightedChallengeAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedChallengeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted challenge allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round(this.sendAt * this.windowDays * 100) / 100;
  }

  copy(): WeightedChallengeAllocation {
    return new WeightedChallengeAllocation(
      this.code,
      this.title,
      this.variant,
      this.sendAt,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted challenge allocation in status proposed. */
export function newWeightedChallengeAllocation(code: string, title: string): WeightedChallengeAllocation {
  return new WeightedChallengeAllocation(code, title, "", 0, 0, "proposed");
}
