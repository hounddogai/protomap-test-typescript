import * as text from "../../../../kit/text.js";

/** Where a step metric is in its life cycle. */
export type StepMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** A step metric as the step team keeps it. */
export class StepMetric {
  code: string;
  title: string;
  summary: string;
  unit: string;
  capacity: number;
  amount: number;
  endsAt: number;
  status: StepMetricStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    unit: string,
    capacity: number,
    amount: number,
    endsAt: number,
    status: StepMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.unit = unit;
    this.capacity = capacity;
    this.amount = amount;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StepMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.endsAt + this.capacity) * 100) / 100;
  }

  copy(): StepMetric {
    return new StepMetric(
      this.code,
      this.title,
      this.summary,
      this.unit,
      this.capacity,
      this.amount,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a step metric in status new. */
export function newStepMetric(code: string, title: string): StepMetric {
  return new StepMetric(code, title, "", "", 0, 0, 0, "new");
}
