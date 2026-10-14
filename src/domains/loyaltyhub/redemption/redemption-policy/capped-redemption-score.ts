import * as text from "../../../../kit/text.js";

/** Where a capped redemption score is in its life cycle. */
export type CappedRedemptionScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped redemption score and its current status. */
export class CappedRedemptionScore {
  code: string;
  name: string;
  maximum: number;
  active: boolean;
  reviewer: string;
  approved: boolean;
  region: string;
  visible: boolean;
  quantity: number;
  bid: number;
  startsAt: number;
  status: CappedRedemptionScoreStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    active: boolean,
    reviewer: string,
    approved: boolean,
    region: string,
    visible: boolean,
    quantity: number,
    bid: number,
    startsAt: number,
    status: CappedRedemptionScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.active = active;
    this.reviewer = reviewer;
    this.approved = approved;
    this.region = region;
    this.visible = visible;
    this.quantity = quantity;
    this.bid = bid;
    this.startsAt = startsAt;
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

  canMoveTo(next: CappedRedemptionScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedRedemptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped redemption score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.startsAt - this.quantity) * 100) / 100;
  }

  copy(): CappedRedemptionScore {
    return new CappedRedemptionScore(
      this.code,
      this.name,
      this.maximum,
      this.active,
      this.reviewer,
      this.approved,
      this.region,
      this.visible,
      this.quantity,
      this.bid,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped redemption score in status open. */
export function newCappedRedemptionScore(code: string, name: string): CappedRedemptionScore {
  return new CappedRedemptionScore(code, name, 0, false, "", false, "", false, 0, 0, 0, "open");
}
