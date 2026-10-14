import * as text from "../../../../kit/text.js";

/** Where a weighted insight override is in its life cycle. */
export type WeightedInsightOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted insight override. Its code is unique within a tenant. */
export class WeightedInsightOverride {
  code: string;
  label: string;
  source: string;
  cost: number;
  country: string;
  description: string;
  currency: string;
  reviewer: string;
  status: WeightedInsightOverrideStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    cost: number,
    country: string,
    description: string,
    currency: string,
    reviewer: string,
    status: WeightedInsightOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.cost = cost;
    this.country = country;
    this.description = description;
    this.currency = currency;
    this.reviewer = reviewer;
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

  canMoveTo(next: WeightedInsightOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedInsightOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted insight override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): WeightedInsightOverride {
    return new WeightedInsightOverride(
      this.code,
      this.label,
      this.source,
      this.cost,
      this.country,
      this.description,
      this.currency,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted insight override in status idle. */
export function newWeightedInsightOverride(code: string, label: string): WeightedInsightOverride {
  return new WeightedInsightOverride(code, label, "", 0, "", "", "", "", "idle");
}
