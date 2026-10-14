import * as text from "../../../../kit/text.js";

/** Where a manual placement threshold is in its life cycle. */
export type ManualPlacementThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a manual placement threshold and its current status. */
export class ManualPlacementThreshold {
  code: string;
  label: string;
  batchSize: number;
  minimum: number;
  title: string;
  retries: number;
  unit: string;
  timezone: string;
  maximum: number;
  status: ManualPlacementThresholdStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    minimum: number,
    title: string,
    retries: number,
    unit: string,
    timezone: string,
    maximum: number,
    status: ManualPlacementThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.minimum = minimum;
    this.title = title;
    this.retries = retries;
    this.unit = unit;
    this.timezone = timezone;
    this.maximum = maximum;
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

  canMoveTo(next: ManualPlacementThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualPlacementThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual placement threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.maximum - this.retries) * 100) / 100;
  }

  copy(): ManualPlacementThreshold {
    return new ManualPlacementThreshold(
      this.code,
      this.label,
      this.batchSize,
      this.minimum,
      this.title,
      this.retries,
      this.unit,
      this.timezone,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual placement threshold in status proposed. */
export function newManualPlacementThreshold(code: string, label: string): ManualPlacementThreshold {
  return new ManualPlacementThreshold(code, label, 0, 0, "", 0, "", "", 0, "proposed");
}
