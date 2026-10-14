import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule adjustment is in its life cycle. */
export type FallbackBidRuleAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback bid rule adjustment and its current status. */
export class FallbackBidRuleAdjustment {
  code: string;
  title: string;
  currency: string;
  weight: number;
  margin: number;
  segment: string;
  ceiling: number;
  region: string;
  status: FallbackBidRuleAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    weight: number,
    margin: number,
    segment: string,
    ceiling: number,
    region: string,
    status: FallbackBidRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.weight = weight;
    this.margin = margin;
    this.segment = segment;
    this.ceiling = ceiling;
    this.region = region;
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

  canMoveTo(next: FallbackBidRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackBidRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback bid rule adjustment"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.ceiling * this.weight * 100) / 100;
  }

  copy(): FallbackBidRuleAdjustment {
    return new FallbackBidRuleAdjustment(
      this.code,
      this.title,
      this.currency,
      this.weight,
      this.margin,
      this.segment,
      this.ceiling,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback bid rule adjustment in status proposed. */
export function newFallbackBidRuleAdjustment(code: string, title: string): FallbackBidRuleAdjustment {
  return new FallbackBidRuleAdjustment(code, title, "", 0, 0, "", 0, "", "proposed");
}
