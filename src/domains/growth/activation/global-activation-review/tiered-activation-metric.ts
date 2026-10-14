import * as text from "../../../../kit/text.js";

/** Where a tiered activation metric is in its life cycle. */
export type TieredActivationMetricStatus = "created" | "validated" | "published" | "retired";

/** A tiered activation metric. Its code is unique within a tenant. */
export class TieredActivationMetric {
  code: string;
  label: string;
  limit: number;
  clicks: number;
  journeyId: string;
  endsAt: number;
  cost: number;
  attempts: number;
  status: TieredActivationMetricStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    clicks: number,
    journeyId: string,
    endsAt: number,
    cost: number,
    attempts: number,
    status: TieredActivationMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.clicks = clicks;
    this.journeyId = journeyId;
    this.endsAt = endsAt;
    this.cost = cost;
    this.attempts = attempts;
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

  canMoveTo(next: TieredActivationMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredActivationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered activation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round(this.clicks * this.attempts * 100) / 100;
  }

  copy(): TieredActivationMetric {
    return new TieredActivationMetric(
      this.code,
      this.label,
      this.limit,
      this.clicks,
      this.journeyId,
      this.endsAt,
      this.cost,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered activation metric in status created. */
export function newTieredActivationMetric(code: string, label: string): TieredActivationMetric {
  return new TieredActivationMetric(code, label, 0, 0, "", 0, 0, 0, "created");
}
