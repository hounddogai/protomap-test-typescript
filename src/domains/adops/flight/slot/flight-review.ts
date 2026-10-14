import * as text from "../../../../kit/text.js";

/** Where a flight review is in its life cycle. */
export type FlightReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a flight review and its current status. */
export class FlightReview {
  code: string;
  label: string;
  ownerId: string;
  createdAt: number;
  limit: number;
  ceiling: number;
  campaignRef: string;
  openRate: number;
  status: FlightReviewStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    createdAt: number,
    limit: number,
    ceiling: number,
    campaignRef: string,
    openRate: number,
    status: FlightReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.limit = limit;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: FlightReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: FlightReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.ceiling * this.createdAt * 100) / 100;
  }

  copy(): FlightReview {
    return new FlightReview(
      this.code,
      this.label,
      this.ownerId,
      this.createdAt,
      this.limit,
      this.ceiling,
      this.campaignRef,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a flight review in status requested. */
export function newFlightReview(code: string, label: string): FlightReview {
  return new FlightReview(code, label, "", 0, 0, 0, "", 0, "requested");
}
