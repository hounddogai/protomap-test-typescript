import * as text from "../../../../kit/text.js";

/** Where a double opt in estimate is in its life cycle. */
export type DoubleOptInEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a double opt in estimate and its current status. */
export class DoubleOptInEstimate {
  code: string;
  title: string;
  audienceId: string;
  startsAt: number;
  conversionRate: number;
  updatedAt: number;
  campaignRef: string;
  country: string;
  minimum: number;
  status: DoubleOptInEstimateStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    startsAt: number,
    conversionRate: number,
    updatedAt: number,
    campaignRef: string,
    country: string,
    minimum: number,
    status: DoubleOptInEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.conversionRate = conversionRate;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.country = country;
    this.minimum = minimum;
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

  canMoveTo(next: DoubleOptInEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DoubleOptInEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"double opt in estimate"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.conversionRate * this.updatedAt * 100) / 100;
  }

  copy(): DoubleOptInEstimate {
    return new DoubleOptInEstimate(
      this.code,
      this.title,
      this.audienceId,
      this.startsAt,
      this.conversionRate,
      this.updatedAt,
      this.campaignRef,
      this.country,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a double opt in estimate in status proposed. */
export function newDoubleOptInEstimate(code: string, title: string): DoubleOptInEstimate {
  return new DoubleOptInEstimate(code, title, "", 0, 0, 0, "", "", 0, "proposed");
}
