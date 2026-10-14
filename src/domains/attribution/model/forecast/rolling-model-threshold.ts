import * as text from "../../../../kit/text.js";

/** Where a rolling model threshold is in its life cycle. */
export type RollingModelThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling model threshold and its current status. */
export class RollingModelThreshold {
  code: string;
  label: string;
  unit: string;
  score: number;
  notes: string;
  windowDays: number;
  batchSize: number;
  attributes: Map<string, string>;
  floorValue: number;
  threshold: number;
  budget: number;
  status: RollingModelThresholdStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    score: number,
    notes: string,
    windowDays: number,
    batchSize: number,
    attributes: Map<string, string>,
    floorValue: number,
    threshold: number,
    budget: number,
    status: RollingModelThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.score = score;
    this.notes = notes;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.attributes = attributes;
    this.floorValue = floorValue;
    this.threshold = threshold;
    this.budget = budget;
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

  canMoveTo(next: RollingModelThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingModelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling model threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling model threshold"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.batchSize + this.score) * 100) / 100;
  }

  copy(): RollingModelThreshold {
    return new RollingModelThreshold(
      this.code,
      this.label,
      this.unit,
      this.score,
      this.notes,
      this.windowDays,
      this.batchSize,
      this.attributes,
      this.floorValue,
      this.threshold,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling model threshold in status proposed. */
export function newRollingModelThreshold(code: string, label: string): RollingModelThreshold {
  return new RollingModelThreshold(code, label, "", 0, "", 0, 0, new Map<string, string>(), 0, 0, 0, "proposed");
}
