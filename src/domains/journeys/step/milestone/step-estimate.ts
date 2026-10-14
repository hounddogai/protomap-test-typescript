import * as text from "../../../../kit/text.js";

/** Where a step estimate is in its life cycle. */
export type StepEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A step estimate. Its code is unique within a tenant. */
export class StepEstimate {
  code: string;
  name: string;
  margin: number;
  weight: number;
  durationMinutes: number;
  status: StepEstimateStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    weight: number,
    durationMinutes: number,
    status: StepEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.weight = weight;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: StepEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round(this.margin * this.weight * 100) / 100;
  }

  copy(): StepEstimate {
    return new StepEstimate(this.code, this.name, this.margin, this.weight, this.durationMinutes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step estimate in status draft. */
export function newStepEstimate(code: string, name: string): StepEstimate {
  return new StepEstimate(code, name, 0, 0, 0, "draft");
}
