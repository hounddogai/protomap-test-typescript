import * as text from "../../../../kit/text.js";

/** Where a global retention metric is in its life cycle. */
export type GlobalRetentionMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global retention metric, with what the planners need to act on it. */
export class GlobalRetentionMetric {
  code: string;
  label: string;
  frequencyCap: number;
  contactEmail: string;
  graceDays: number;
  maximum: number;
  budget: number;
  conversionRate: number;
  status: GlobalRetentionMetricStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    contactEmail: string,
    graceDays: number,
    maximum: number,
    budget: number,
    conversionRate: number,
    status: GlobalRetentionMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.maximum = maximum;
    this.budget = budget;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: GlobalRetentionMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRetentionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate + this.budget) * 100) / 100;
  }

  copy(): GlobalRetentionMetric {
    return new GlobalRetentionMetric(
      this.code,
      this.label,
      this.frequencyCap,
      this.contactEmail,
      this.graceDays,
      this.maximum,
      this.budget,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global retention metric in status proposed. */
export function newGlobalRetentionMetric(code: string, label: string): GlobalRetentionMetric {
  return new GlobalRetentionMetric(code, label, 0, "", 0, 0, 0, 0, "proposed");
}
