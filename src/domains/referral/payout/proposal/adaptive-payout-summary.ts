import * as text from "../../../../kit/text.js";

/** Where a adaptive payout summary is in its life cycle. */
export type AdaptivePayoutSummaryStatus = "created" | "validated" | "published" | "retired";

/** A adaptive payout summary. Its code is unique within a tenant. */
export class AdaptivePayoutSummary {
  code: string;
  label: string;
  ownerId: string;
  floorValue: number;
  impressions: number;
  status: AdaptivePayoutSummaryStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    floorValue: number,
    impressions: number,
    status: AdaptivePayoutSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.impressions = impressions;
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

  canMoveTo(next: AdaptivePayoutSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePayoutSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive payout summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.floorValue * this.impressions * 100) / 100;
  }

  copy(): AdaptivePayoutSummary {
    return new AdaptivePayoutSummary(
      this.code,
      this.label,
      this.ownerId,
      this.floorValue,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive payout summary in status created. */
export function newAdaptivePayoutSummary(code: string, label: string): AdaptivePayoutSummary {
  return new AdaptivePayoutSummary(code, label, "", 0, 0, "created");
}
