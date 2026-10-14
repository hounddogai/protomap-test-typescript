import * as text from "../../../../kit/text.js";

/** Where a strict bid rule variance is in its life cycle. */
export type StrictBidRuleVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict bid rule variance. Its code is unique within a tenant. */
export class StrictBidRuleVariance {
  code: string;
  label: string;
  margin: number;
  ceiling: number;
  frequencyCap: number;
  reviewer: string;
  updatedAt: number;
  openRate: number;
  unit: string;
  status: StrictBidRuleVarianceStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    ceiling: number,
    frequencyCap: number,
    reviewer: string,
    updatedAt: number,
    openRate: number,
    unit: string,
    status: StrictBidRuleVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.unit = unit;
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

  canMoveTo(next: StrictBidRuleVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictBidRuleVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bid rule variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.updatedAt - this.openRate) * 100) / 100;
  }

  copy(): StrictBidRuleVariance {
    return new StrictBidRuleVariance(
      this.code,
      this.label,
      this.margin,
      this.ceiling,
      this.frequencyCap,
      this.reviewer,
      this.updatedAt,
      this.openRate,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict bid rule variance in status idle. */
export function newStrictBidRuleVariance(code: string, label: string): StrictBidRuleVariance {
  return new StrictBidRuleVariance(code, label, 0, 0, 0, "", 0, 0, "", "idle");
}
