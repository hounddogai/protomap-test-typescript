import * as text from "../../../../kit/text.js";

/** Where a weighted journey batch is in its life cycle. */
export type WeightedJourneyBatchStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted journey batch. Its code is unique within a tenant. */
export class WeightedJourneyBatch {
  code: string;
  label: string;
  priority: number;
  timezone: string;
  margin: number;
  status: WeightedJourneyBatchStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    timezone: string,
    margin: number,
    status: WeightedJourneyBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.timezone = timezone;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedJourneyBatchStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedJourneyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted journey batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round(this.priority * this.margin * 100) / 100;
  }

  copy(): WeightedJourneyBatch {
    return new WeightedJourneyBatch(this.code, this.label, this.priority, this.timezone, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted journey batch in status open. */
export function newWeightedJourneyBatch(code: string, label: string): WeightedJourneyBatch {
  return new WeightedJourneyBatch(code, label, 0, "", 0, "open");
}
