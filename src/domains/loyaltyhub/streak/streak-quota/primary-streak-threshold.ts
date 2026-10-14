import * as text from "../../../../kit/text.js";

/** Where a primary streak threshold is in its life cycle. */
export type PrimaryStreakThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary streak threshold. Its code is unique within a tenant. */
export class PrimaryStreakThreshold {
  code: string;
  title: string;
  retries: number;
  unit: string;
  segment: string;
  locale: string;
  reviewer: string;
  margin: number;
  conversionRate: number;
  journeyId: string;
  phone: string;
  status: PrimaryStreakThresholdStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    unit: string,
    segment: string,
    locale: string,
    reviewer: string,
    margin: number,
    conversionRate: number,
    journeyId: string,
    phone: string,
    status: PrimaryStreakThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.unit = unit;
    this.segment = segment;
    this.locale = locale;
    this.reviewer = reviewer;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.journeyId = journeyId;
    this.phone = phone;
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

  canMoveTo(next: PrimaryStreakThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryStreakThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary streak threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary streak threshold"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.conversionRate * this.margin * 100) / 100;
  }

  copy(): PrimaryStreakThreshold {
    return new PrimaryStreakThreshold(
      this.code,
      this.title,
      this.retries,
      this.unit,
      this.segment,
      this.locale,
      this.reviewer,
      this.margin,
      this.conversionRate,
      this.journeyId,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary streak threshold in status draft. */
export function newPrimaryStreakThreshold(code: string, title: string): PrimaryStreakThreshold {
  return new PrimaryStreakThreshold(code, title, 0, "", "", "", "", 0, 0, "", "", "draft");
}
