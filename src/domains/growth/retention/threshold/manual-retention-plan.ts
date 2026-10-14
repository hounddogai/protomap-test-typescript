import * as text from "../../../../kit/text.js";

/** Where a manual retention plan is in its life cycle. */
export type ManualRetentionPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a manual retention plan and its current status. */
export class ManualRetentionPlan {
  code: string;
  label: string;
  journeyId: string;
  timezone: string;
  expiresAt: number;
  cost: number;
  budget: number;
  archived: boolean;
  name: string;
  status: ManualRetentionPlanStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    timezone: string,
    expiresAt: number,
    cost: number,
    budget: number,
    archived: boolean,
    name: string,
    status: ManualRetentionPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.budget = budget;
    this.archived = archived;
    this.name = name;
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

  canMoveTo(next: ManualRetentionPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualRetentionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual retention plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.budget + this.cost) * 100) / 100;
  }

  copy(): ManualRetentionPlan {
    return new ManualRetentionPlan(
      this.code,
      this.label,
      this.journeyId,
      this.timezone,
      this.expiresAt,
      this.cost,
      this.budget,
      this.archived,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual retention plan in status draft. */
export function newManualRetentionPlan(code: string, label: string): ManualRetentionPlan {
  return new ManualRetentionPlan(code, label, "", "", 0, 0, 0, false, "", "draft");
}
