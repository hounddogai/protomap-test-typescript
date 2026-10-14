import * as text from "../../../../kit/text.js";

/** Where a lenient window metric is in its life cycle. */
export type LenientWindowMetricStatus = "created" | "validated" | "published" | "retired";

/** A lenient window metric. Its code is unique within a tenant. */
export class LenientWindowMetric {
  code: string;
  label: string;
  openRate: number;
  channel: string;
  conversionRate: number;
  budget: number;
  status: LenientWindowMetricStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    channel: string,
    conversionRate: number,
    budget: number,
    status: LenientWindowMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.budget = budget;
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

  canMoveTo(next: LenientWindowMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientWindowMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient window metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.conversionRate * 100) / 100;
  }

  copy(): LenientWindowMetric {
    return new LenientWindowMetric(
      this.code,
      this.label,
      this.openRate,
      this.channel,
      this.conversionRate,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient window metric in status created. */
export function newLenientWindowMetric(code: string, label: string): LenientWindowMetric {
  return new LenientWindowMetric(code, label, 0, "", 0, 0, "created");
}
