import * as text from "../../../../kit/text.js";

/** Where a redemption forecast is in its life cycle. */
export type RedemptionForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A redemption forecast. Its code is unique within a tenant. */
export class RedemptionForecast {
  code: string;
  name: string;
  batchSize: number;
  maximum: number;
  reviewer: string;
  unit: string;
  currency: string;
  campaignRef: string;
  status: RedemptionForecastStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    maximum: number,
    reviewer: string,
    unit: string,
    currency: string,
    campaignRef: string,
    status: RedemptionForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.unit = unit;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RedemptionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.maximum * this.batchSize * 100) / 100;
  }

  copy(): RedemptionForecast {
    return new RedemptionForecast(
      this.code,
      this.name,
      this.batchSize,
      this.maximum,
      this.reviewer,
      this.unit,
      this.currency,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a redemption forecast in status open. */
export function newRedemptionForecast(code: string, name: string): RedemptionForecast {
  return new RedemptionForecast(code, name, 0, 0, "", "", "", "", "open");
}
