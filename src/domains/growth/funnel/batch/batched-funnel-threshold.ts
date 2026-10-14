import * as text from "../../../../kit/text.js";

/** Where a batched funnel threshold is in its life cycle. */
export type BatchedFunnelThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched funnel threshold as the funnel team keeps it. */
export class BatchedFunnelThreshold {
  code: string;
  label: string;
  rate: number;
  approved: boolean;
  description: string;
  cost: number;
  createdAt: number;
  clicks: number;
  expiresAt: number;
  status: BatchedFunnelThresholdStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    approved: boolean,
    description: string,
    cost: number,
    createdAt: number,
    clicks: number,
    expiresAt: number,
    status: BatchedFunnelThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.approved = approved;
    this.description = description;
    this.cost = cost;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: BatchedFunnelThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedFunnelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched funnel threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round((this.expiresAt - this.cost) * 100) / 100;
  }

  copy(): BatchedFunnelThreshold {
    return new BatchedFunnelThreshold(
      this.code,
      this.label,
      this.rate,
      this.approved,
      this.description,
      this.cost,
      this.createdAt,
      this.clicks,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched funnel threshold in status proposed. */
export function newBatchedFunnelThreshold(code: string, label: string): BatchedFunnelThreshold {
  return new BatchedFunnelThreshold(code, label, 0, false, "", 0, 0, 0, 0, "proposed");
}
