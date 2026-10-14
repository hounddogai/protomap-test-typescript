import * as text from "../../../../kit/text.js";

/** Where a capped reward rule assignment is in its life cycle. */
export type CappedRewardRuleAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A capped reward rule assignment. Its code is unique within a tenant. */
export class CappedRewardRuleAssignment {
  code: string;
  label: string;
  maximum: number;
  budget: number;
  journeyId: string;
  quantity: number;
  cost: number;
  startsAt: number;
  status: CappedRewardRuleAssignmentStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    budget: number,
    journeyId: string,
    quantity: number,
    cost: number,
    startsAt: number,
    status: CappedRewardRuleAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.budget = budget;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.cost = cost;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedRewardRuleAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedRewardRuleAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reward rule assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.budget + this.startsAt) * 100) / 100;
  }

  copy(): CappedRewardRuleAssignment {
    return new CappedRewardRuleAssignment(
      this.code,
      this.label,
      this.maximum,
      this.budget,
      this.journeyId,
      this.quantity,
      this.cost,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped reward rule assignment in status draft. */
export function newCappedRewardRuleAssignment(code: string, label: string): CappedRewardRuleAssignment {
  return new CappedRewardRuleAssignment(code, label, 0, 0, "", 0, 0, 0, "draft");
}
