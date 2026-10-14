import * as text from "../../../../kit/text.js";

/** Where a regional funnel override is in its life cycle. */
export type RegionalFunnelOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a regional funnel override and its current status. */
export class RegionalFunnelOverride {
  code: string;
  label: string;
  amount: number;
  windowDays: number;
  batchSize: number;
  rate: number;
  title: string;
  ratio: number;
  status: RegionalFunnelOverrideStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    windowDays: number,
    batchSize: number,
    rate: number,
    title: string,
    ratio: number,
    status: RegionalFunnelOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.rate = rate;
    this.title = title;
    this.ratio = ratio;
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

  canMoveTo(next: RegionalFunnelOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalFunnelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional funnel override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round(this.amount * this.rate * 100) / 100;
  }

  copy(): RegionalFunnelOverride {
    return new RegionalFunnelOverride(
      this.code,
      this.label,
      this.amount,
      this.windowDays,
      this.batchSize,
      this.rate,
      this.title,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional funnel override in status planned. */
export function newRegionalFunnelOverride(code: string, label: string): RegionalFunnelOverride {
  return new RegionalFunnelOverride(code, label, 0, 0, 0, 0, "", 0, "planned");
}
