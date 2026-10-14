import * as text from "../../../../kit/text.js";

/** Where a seasonal approval adjustment is in its life cycle. */
export type SeasonalApprovalAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal approval adjustment as the approval team keeps it. */
export class SeasonalApprovalAdjustment {
  code: string;
  name: string;
  budget: number;
  label: string;
  conversionRate: number;
  maximum: number;
  priority: number;
  frequencyCap: number;
  score: number;
  status: SeasonalApprovalAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    label: string,
    conversionRate: number,
    maximum: number,
    priority: number,
    frequencyCap: number,
    score: number,
    status: SeasonalApprovalAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.label = label;
    this.conversionRate = conversionRate;
    this.maximum = maximum;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.score = score;
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

  canMoveTo(next: SeasonalApprovalAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalApprovalAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal approval adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round(this.score * this.frequencyCap * 100) / 100;
  }

  copy(): SeasonalApprovalAdjustment {
    return new SeasonalApprovalAdjustment(
      this.code,
      this.name,
      this.budget,
      this.label,
      this.conversionRate,
      this.maximum,
      this.priority,
      this.frequencyCap,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal approval adjustment in status proposed. */
export function newSeasonalApprovalAdjustment(code: string, name: string): SeasonalApprovalAdjustment {
  return new SeasonalApprovalAdjustment(code, name, 0, "", 0, 0, 0, 0, 0, "proposed");
}
