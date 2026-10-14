import * as text from "../../../../kit/text.js";

/** Where a enrollment forecast is in its life cycle. */
export type EnrollmentForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a enrollment forecast and its current status. */
export class EnrollmentForecast {
  code: string;
  label: string;
  floorValue: number;
  region: string;
  approved: boolean;
  journeyId: string;
  audienceId: string;
  amount: number;
  discount: number;
  status: EnrollmentForecastStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    region: string,
    approved: boolean,
    journeyId: string,
    audienceId: string,
    amount: number,
    discount: number,
    status: EnrollmentForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.region = region;
    this.approved = approved;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.amount = amount;
    this.discount = discount;
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

  canMoveTo(next: EnrollmentForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveVolume(): number {
    return Math.round((this.amount + this.discount) * 100) / 100;
  }

  copy(): EnrollmentForecast {
    return new EnrollmentForecast(
      this.code,
      this.label,
      this.floorValue,
      this.region,
      this.approved,
      this.journeyId,
      this.audienceId,
      this.amount,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a enrollment forecast in status draft. */
export function newEnrollmentForecast(code: string, label: string): EnrollmentForecast {
  return new EnrollmentForecast(code, label, 0, "", false, "", "", 0, 0, "draft");
}
