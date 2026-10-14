import * as text from "../../../../kit/text.js";

/** Where a batched funnel rule is in its life cycle. */
export type BatchedFunnelRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched funnel rule and its current status. */
export class BatchedFunnelRule {
  code: string;
  name: string;
  impressions: number;
  journeyId: string;
  graceDays: number;
  openRate: number;
  status: BatchedFunnelRuleStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    journeyId: string,
    graceDays: number,
    openRate: number,
    status: BatchedFunnelRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedFunnelRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedFunnelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched funnel rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.impressions + this.graceDays) * 100) / 100;
  }

  copy(): BatchedFunnelRule {
    return new BatchedFunnelRule(
      this.code,
      this.name,
      this.impressions,
      this.journeyId,
      this.graceDays,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched funnel rule in status requested. */
export function newBatchedFunnelRule(code: string, name: string): BatchedFunnelRule {
  return new BatchedFunnelRule(code, name, 0, "", 0, 0, "requested");
}
