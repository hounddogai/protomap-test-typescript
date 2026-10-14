import * as text from "../../../../kit/text.js";

/** Where a weighted bid rule estimate is in its life cycle. */
export type WeightedBidRuleEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a weighted bid rule estimate and its current status. */
export class WeightedBidRuleEstimate {
  code: string;
  label: string;
  impressions: number;
  locale: string;
  notes: string;
  startsAt: number;
  status: WeightedBidRuleEstimateStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    locale: string,
    notes: string,
    startsAt: number,
    status: WeightedBidRuleEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.locale = locale;
    this.notes = notes;
    this.startsAt = startsAt;
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

  canMoveTo(next: WeightedBidRuleEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedBidRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted bid rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.impressions + this.startsAt) * 100) / 100;
  }

  copy(): WeightedBidRuleEstimate {
    return new WeightedBidRuleEstimate(
      this.code,
      this.label,
      this.impressions,
      this.locale,
      this.notes,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted bid rule estimate in status requested. */
export function newWeightedBidRuleEstimate(code: string, label: string): WeightedBidRuleEstimate {
  return new WeightedBidRuleEstimate(code, label, 0, "", "", 0, "requested");
}
