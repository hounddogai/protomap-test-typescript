import * as text from "../../../../kit/text.js";

/** Where a opt out metric is in its life cycle. */
export type OptOutMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One opt out metric, with what the planners need to act on it. */
export class OptOutMetric {
  code: string;
  label: string;
  sendAt: number;
  ceiling: number;
  conversionRate: number;
  variant: string;
  rate: number;
  visible: boolean;
  threshold: number;
  status: OptOutMetricStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    ceiling: number,
    conversionRate: number,
    variant: string,
    rate: number,
    visible: boolean,
    threshold: number,
    status: OptOutMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.ceiling = ceiling;
    this.conversionRate = conversionRate;
    this.variant = variant;
    this.rate = rate;
    this.visible = visible;
    this.threshold = threshold;
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

  canMoveTo(next: OptOutMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: OptOutMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.sendAt + this.conversionRate) * 100) / 100;
  }

  copy(): OptOutMetric {
    return new OptOutMetric(
      this.code,
      this.label,
      this.sendAt,
      this.ceiling,
      this.conversionRate,
      this.variant,
      this.rate,
      this.visible,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a opt out metric in status proposed. */
export function newOptOutMetric(code: string, label: string): OptOutMetric {
  return new OptOutMetric(code, label, 0, 0, 0, "", 0, false, 0, "proposed");
}
