import * as text from "../../../../kit/text.js";

/** Where a weighted deflection assignment is in its life cycle. */
export type WeightedDeflectionAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a weighted deflection assignment and its current status. */
export class WeightedDeflectionAssignment {
  code: string;
  label: string;
  limit: number;
  ceiling: number;
  updatedAt: number;
  budget: number;
  conversionRate: number;
  status: WeightedDeflectionAssignmentStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    ceiling: number,
    updatedAt: number,
    budget: number,
    conversionRate: number,
    status: WeightedDeflectionAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.ceiling = ceiling;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedDeflectionAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedDeflectionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted deflection assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.conversionRate - this.limit) * 100) / 100;
  }

  copy(): WeightedDeflectionAssignment {
    return new WeightedDeflectionAssignment(
      this.code,
      this.label,
      this.limit,
      this.ceiling,
      this.updatedAt,
      this.budget,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted deflection assignment in status requested. */
export function newWeightedDeflectionAssignment(code: string, label: string): WeightedDeflectionAssignment {
  return new WeightedDeflectionAssignment(code, label, 0, 0, 0, 0, 0, "requested");
}
