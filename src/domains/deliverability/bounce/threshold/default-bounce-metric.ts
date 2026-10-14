import * as text from "../../../../kit/text.js";

/** Where a default bounce metric is in its life cycle. */
export type DefaultBounceMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default bounce metric. Its code is unique within a tenant. */
export class DefaultBounceMetric {
  code: string;
  label: string;
  graceDays: number;
  openRate: number;
  region: string;
  createdAt: number;
  unit: string;
  status: DefaultBounceMetricStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    openRate: number,
    region: string,
    createdAt: number,
    unit: string,
    status: DefaultBounceMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.region = region;
    this.createdAt = createdAt;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultBounceMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultBounceMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default bounce metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round((this.openRate + this.graceDays) * 100) / 100;
  }

  copy(): DefaultBounceMetric {
    return new DefaultBounceMetric(
      this.code,
      this.label,
      this.graceDays,
      this.openRate,
      this.region,
      this.createdAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a default bounce metric in status planned. */
export function newDefaultBounceMetric(code: string, label: string): DefaultBounceMetric {
  return new DefaultBounceMetric(code, label, 0, 0, "", 0, "", "planned");
}
