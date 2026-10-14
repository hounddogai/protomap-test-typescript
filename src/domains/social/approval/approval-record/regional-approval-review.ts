import * as text from "../../../../kit/text.js";

/** Where a regional approval review is in its life cycle. */
export type RegionalApprovalReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a regional approval review and its current status. */
export class RegionalApprovalReview {
  code: string;
  label: string;
  country: string;
  margin: number;
  version: number;
  phone: string;
  createdAt: number;
  contactEmail: string;
  weight: number;
  timezone: string;
  score: number;
  status: RegionalApprovalReviewStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    margin: number,
    version: number,
    phone: string,
    createdAt: number,
    contactEmail: string,
    weight: number,
    timezone: string,
    score: number,
    status: RegionalApprovalReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.margin = margin;
    this.version = version;
    this.phone = phone;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.timezone = timezone;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalApprovalReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalApprovalReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional approval review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.score * this.createdAt * 100) / 100;
  }

  copy(): RegionalApprovalReview {
    return new RegionalApprovalReview(
      this.code,
      this.label,
      this.country,
      this.margin,
      this.version,
      this.phone,
      this.createdAt,
      this.contactEmail,
      this.weight,
      this.timezone,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional approval review in status idle. */
export function newRegionalApprovalReview(code: string, label: string): RegionalApprovalReview {
  return new RegionalApprovalReview(code, label, "", 0, 0, "", 0, "", 0, "", 0, "idle");
}
