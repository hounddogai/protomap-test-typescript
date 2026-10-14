import * as text from "../../../../kit/text.js";

/** Where a reward assignment is in its life cycle. */
export type RewardAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reward assignment, with what the planners need to act on it. */
export class RewardAssignment {
  code: string;
  label: string;
  graceDays: number;
  ownerId: string;
  retries: number;
  unit: string;
  score: number;
  ratio: number;
  reviewer: string;
  status: RewardAssignmentStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    ownerId: string,
    retries: number,
    unit: string,
    score: number,
    ratio: number,
    reviewer: string,
    status: RewardAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.ownerId = ownerId;
    this.retries = retries;
    this.unit = unit;
    this.score = score;
    this.ratio = ratio;
    this.reviewer = reviewer;
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

  canMoveTo(next: RewardAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RewardAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.graceDays - this.score) * 100) / 100;
  }

  copy(): RewardAssignment {
    return new RewardAssignment(
      this.code,
      this.label,
      this.graceDays,
      this.ownerId,
      this.retries,
      this.unit,
      this.score,
      this.ratio,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a reward assignment in status proposed. */
export function newRewardAssignment(code: string, label: string): RewardAssignment {
  return new RewardAssignment(code, label, 0, "", 0, "", 0, 0, "", "proposed");
}
