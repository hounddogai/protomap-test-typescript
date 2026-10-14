import * as text from "../../../../kit/text.js";

/** Where a primary enrollment estimate is in its life cycle. */
export type PrimaryEnrollmentEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary enrollment estimate as the enrollment team keeps it. */
export class PrimaryEnrollmentEstimate {
  code: string;
  name: string;
  unit: string;
  score: number;
  createdAt: number;
  status: PrimaryEnrollmentEstimateStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    score: number,
    createdAt: number,
    status: PrimaryEnrollmentEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.score = score;
    this.createdAt = createdAt;
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

  canMoveTo(next: PrimaryEnrollmentEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryEnrollmentEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary enrollment estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round((this.createdAt - this.score) * 100) / 100;
  }

  copy(): PrimaryEnrollmentEstimate {
    return new PrimaryEnrollmentEstimate(this.code, this.name, this.unit, this.score, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary enrollment estimate in status proposed. */
export function newPrimaryEnrollmentEstimate(code: string, name: string): PrimaryEnrollmentEstimate {
  return new PrimaryEnrollmentEstimate(code, name, "", 0, 0, "proposed");
}
