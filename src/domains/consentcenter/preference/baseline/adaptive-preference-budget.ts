import * as text from "../../../../kit/text.js";

/** Where a adaptive preference budget is in its life cycle. */
export type AdaptivePreferenceBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive preference budget. Its code is unique within a tenant. */
export class AdaptivePreferenceBudget {
  code: string;
  label: string;
  impressions: number;
  score: number;
  rate: number;
  quantity: number;
  limit: number;
  sendAt: number;
  batchSize: number;
  status: AdaptivePreferenceBudgetStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    score: number,
    rate: number,
    quantity: number,
    limit: number,
    sendAt: number,
    batchSize: number,
    status: AdaptivePreferenceBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.score = score;
    this.rate = rate;
    this.quantity = quantity;
    this.limit = limit;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptivePreferenceBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptivePreferenceBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive preference budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.impressions - this.batchSize) * 100) / 100;
  }

  copy(): AdaptivePreferenceBudget {
    return new AdaptivePreferenceBudget(
      this.code,
      this.label,
      this.impressions,
      this.score,
      this.rate,
      this.quantity,
      this.limit,
      this.sendAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive preference budget in status draft. */
export function newAdaptivePreferenceBudget(code: string, label: string): AdaptivePreferenceBudget {
  return new AdaptivePreferenceBudget(code, label, 0, 0, 0, 0, 0, 0, 0, "draft");
}
