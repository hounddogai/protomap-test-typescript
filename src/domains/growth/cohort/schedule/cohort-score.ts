import * as text from "../../../../kit/text.js";

/** Where a cohort score is in its life cycle. */
export type CohortScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A cohort score. Its code is unique within a tenant. */
export class CohortScore {
  code: string;
  title: string;
  checksum: string;
  quantity: number;
  threshold: number;
  floorValue: number;
  windowDays: number;
  campaignRef: string;
  endsAt: number;
  phone: string;
  budget: number;
  status: CohortScoreStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    quantity: number,
    threshold: number,
    floorValue: number,
    windowDays: number,
    campaignRef: string,
    endsAt: number,
    phone: string,
    budget: number,
    status: CohortScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.quantity = quantity;
    this.threshold = threshold;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.phone = phone;
    this.budget = budget;
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

  canMoveTo(next: CohortScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CohortScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.threshold - this.budget) * 100) / 100;
  }

  copy(): CohortScore {
    return new CohortScore(
      this.code,
      this.title,
      this.checksum,
      this.quantity,
      this.threshold,
      this.floorValue,
      this.windowDays,
      this.campaignRef,
      this.endsAt,
      this.phone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a cohort score in status requested. */
export function newCohortScore(code: string, title: string): CohortScore {
  return new CohortScore(code, title, "", 0, 0, 0, 0, "", 0, "", 0, "requested");
}
