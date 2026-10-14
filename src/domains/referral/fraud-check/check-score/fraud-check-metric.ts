import * as text from "../../../../kit/text.js";

/** Where a fraud check metric is in its life cycle. */
export type FraudCheckMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fraud check metric as the fraud check team keeps it. */
export class FraudCheckMetric {
  code: string;
  label: string;
  country: string;
  name: string;
  timezone: string;
  budget: number;
  pinned: boolean;
  phone: string;
  status: FraudCheckMetricStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    name: string,
    timezone: string,
    budget: number,
    pinned: boolean,
    phone: string,
    status: FraudCheckMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.name = name;
    this.timezone = timezone;
    this.budget = budget;
    this.pinned = pinned;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FraudCheckMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): FraudCheckMetric {
    return new FraudCheckMetric(
      this.code,
      this.label,
      this.country,
      this.name,
      this.timezone,
      this.budget,
      this.pinned,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fraud check metric in status idle. */
export function newFraudCheckMetric(code: string, label: string): FraudCheckMetric {
  return new FraudCheckMetric(code, label, "", "", "", 0, false, "", "idle");
}
