import * as text from "../../../../kit/text.js";

/** Where a step policy is in its life cycle. */
export type StepPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A step policy as the step team keeps it. */
export class StepPolicy {
  code: string;
  title: string;
  quantity: number;
  score: number;
  graceDays: number;
  audienceId: string;
  checksum: string;
  category: string;
  segment: string;
  reviewer: string;
  status: StepPolicyStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    score: number,
    graceDays: number,
    audienceId: string,
    checksum: string,
    category: string,
    segment: string,
    reviewer: string,
    status: StepPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.score = score;
    this.graceDays = graceDays;
    this.audienceId = audienceId;
    this.checksum = checksum;
    this.category = category;
    this.segment = segment;
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

  canMoveTo(next: StepPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: StepPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"step policy"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.quantity + this.score) * 100) / 100;
  }

  copy(): StepPolicy {
    return new StepPolicy(
      this.code,
      this.title,
      this.quantity,
      this.score,
      this.graceDays,
      this.audienceId,
      this.checksum,
      this.category,
      this.segment,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a step policy in status proposed. */
export function newStepPolicy(code: string, title: string): StepPolicy {
  return new StepPolicy(code, title, 0, 0, 0, "", "", "", "", "", "proposed");
}
