import * as text from "../../../../kit/text.js";

/** Where a manual pacing variance is in its life cycle. */
export type ManualPacingVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual pacing variance as the pacing team keeps it. */
export class ManualPacingVariance {
  code: string;
  label: string;
  unit: string;
  sequence: number;
  expiresAt: number;
  capacity: number;
  timezone: string;
  status: ManualPacingVarianceStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    sequence: number,
    expiresAt: number,
    capacity: number,
    timezone: string,
    status: ManualPacingVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.sequence = sequence;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.timezone = timezone;
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

  canMoveTo(next: ManualPacingVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualPacingVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual pacing variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round(this.capacity * this.expiresAt * 100) / 100;
  }

  copy(): ManualPacingVariance {
    return new ManualPacingVariance(
      this.code,
      this.label,
      this.unit,
      this.sequence,
      this.expiresAt,
      this.capacity,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual pacing variance in status proposed. */
export function newManualPacingVariance(code: string, label: string): ManualPacingVariance {
  return new ManualPacingVariance(code, label, "", 0, 0, 0, "", "proposed");
}
