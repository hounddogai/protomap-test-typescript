import * as text from "../../../../kit/text.js";

/** Where a reward rule assignment is in its life cycle. */
export type RewardRuleAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A reward rule assignment. Its code is unique within a tenant. */
export class RewardRuleAssignment {
  code: string;
  title: string;
  maximum: number;
  limit: number;
  budget: number;
  sendAt: number;
  status: RewardRuleAssignmentStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    limit: number,
    budget: number,
    sendAt: number,
    status: RewardRuleAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.limit = limit;
    this.budget = budget;
    this.sendAt = sendAt;
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

  canMoveTo(next: RewardRuleAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardRuleAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.maximum + this.budget) * 100) / 100;
  }

  copy(): RewardRuleAssignment {
    return new RewardRuleAssignment(
      this.code,
      this.title,
      this.maximum,
      this.limit,
      this.budget,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward rule assignment in status created. */
export function newRewardRuleAssignment(code: string, title: string): RewardRuleAssignment {
  return new RewardRuleAssignment(code, title, 0, 0, 0, 0, "created");
}
