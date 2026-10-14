import * as text from "../../../../kit/text.js";

/** Where a streak metric is in its life cycle. */
export type StreakMetricStatus = "created" | "validated" | "published" | "retired";

/** A streak metric as the streak team keeps it. */
export class StreakMetric {
  code: string;
  label: string;
  currency: string;
  priority: number;
  endsAt: number;
  approved: boolean;
  margin: number;
  status: StreakMetricStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    priority: number,
    endsAt: number,
    approved: boolean,
    margin: number,
    status: StreakMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.priority = priority;
    this.endsAt = endsAt;
    this.approved = approved;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StreakMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.margin + this.priority) * 100) / 100;
  }

  copy(): StreakMetric {
    return new StreakMetric(
      this.code,
      this.label,
      this.currency,
      this.priority,
      this.endsAt,
      this.approved,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a streak metric in status created. */
export function newStreakMetric(code: string, label: string): StreakMetric {
  return new StreakMetric(code, label, "", 0, 0, false, 0, "created");
}
