import * as text from "../../../../kit/text.js";

/** Where a regional subscription review is in its life cycle. */
export type RegionalSubscriptionReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional subscription review, with what the planners need to act on it. */
export class RegionalSubscriptionReview {
  code: string;
  label: string;
  threshold: number;
  graceDays: number;
  locale: string;
  conversionRate: number;
  campaignRef: string;
  archived: boolean;
  phone: string;
  timezone: string;
  status: RegionalSubscriptionReviewStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    graceDays: number,
    locale: string,
    conversionRate: number,
    campaignRef: string,
    archived: boolean,
    phone: string,
    timezone: string,
    status: RegionalSubscriptionReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.archived = archived;
    this.phone = phone;
    this.timezone = timezone;
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

  canMoveTo(next: RegionalSubscriptionReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSubscriptionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional subscription review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate - this.threshold) * 100) / 100;
  }

  copy(): RegionalSubscriptionReview {
    return new RegionalSubscriptionReview(
      this.code,
      this.label,
      this.threshold,
      this.graceDays,
      this.locale,
      this.conversionRate,
      this.campaignRef,
      this.archived,
      this.phone,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional subscription review in status requested. */
export function newRegionalSubscriptionReview(code: string, label: string): RegionalSubscriptionReview {
  return new RegionalSubscriptionReview(code, label, 0, 0, "", 0, "", false, "", "", "requested");
}
