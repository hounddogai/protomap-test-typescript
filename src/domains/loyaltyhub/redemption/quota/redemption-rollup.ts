import * as text from "../../../../kit/text.js";

/** Where a redemption rollup is in its life cycle. */
export type RedemptionRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A redemption rollup. Its code is unique within a tenant. */
export class RedemptionRollup {
  code: string;
  label: string;
  contactEmail: string;
  cost: number;
  startsAt: number;
  utmSource: string;
  journeyId: string;
  pinned: boolean;
  endsAt: number;
  ownerId: string;
  bid: number;
  status: RedemptionRollupStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    cost: number,
    startsAt: number,
    utmSource: string,
    journeyId: string,
    pinned: boolean,
    endsAt: number,
    ownerId: string,
    bid: number,
    status: RedemptionRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.bid = bid;
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

  canMoveTo(next: RedemptionRollupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "archived";
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

  moveTo(next: RedemptionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"redemption rollup"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.startsAt - this.bid) * 100) / 100;
  }

  copy(): RedemptionRollup {
    return new RedemptionRollup(
      this.code,
      this.label,
      this.contactEmail,
      this.cost,
      this.startsAt,
      this.utmSource,
      this.journeyId,
      this.pinned,
      this.endsAt,
      this.ownerId,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a redemption rollup in status open. */
export function newRedemptionRollup(code: string, label: string): RedemptionRollup {
  return new RedemptionRollup(code, label, "", 0, 0, "", "", false, 0, "", 0, "open");
}
