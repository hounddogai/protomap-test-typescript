import * as text from "../../../../kit/text.js";

/** Where a capped credit threshold is in its life cycle. */
export type CappedCreditThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped credit threshold and its current status. */
export class CappedCreditThreshold {
  code: string;
  title: string;
  externalRef: string;
  approved: boolean;
  floorValue: number;
  campaignRef: string;
  graceDays: number;
  category: string;
  updatedAt: number;
  status: CappedCreditThresholdStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    approved: boolean,
    floorValue: number,
    campaignRef: string,
    graceDays: number,
    category: string,
    updatedAt: number,
    status: CappedCreditThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.approved = approved;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.graceDays = graceDays;
    this.category = category;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: CappedCreditThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedCreditThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped credit threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.updatedAt - this.floorValue) * 100) / 100;
  }

  copy(): CappedCreditThreshold {
    return new CappedCreditThreshold(
      this.code,
      this.title,
      this.externalRef,
      this.approved,
      this.floorValue,
      this.campaignRef,
      this.graceDays,
      this.category,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped credit threshold in status open. */
export function newCappedCreditThreshold(code: string, title: string): CappedCreditThreshold {
  return new CappedCreditThreshold(code, title, "", false, 0, "", 0, "", 0, "open");
}
