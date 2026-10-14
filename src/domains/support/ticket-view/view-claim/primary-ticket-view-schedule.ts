import * as text from "../../../../kit/text.js";

/** Where a primary ticket view schedule is in its life cycle. */
export type PrimaryTicketViewScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary ticket view schedule. Its code is unique within a tenant. */
export class PrimaryTicketViewSchedule {
  code: string;
  label: string;
  ownerId: string;
  country: string;
  openRate: number;
  maximum: number;
  currency: string;
  pinned: boolean;
  bid: number;
  status: PrimaryTicketViewScheduleStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    country: string,
    openRate: number,
    maximum: number,
    currency: string,
    pinned: boolean,
    bid: number,
    status: PrimaryTicketViewScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.country = country;
    this.openRate = openRate;
    this.maximum = maximum;
    this.currency = currency;
    this.pinned = pinned;
    this.bid = bid;
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

  canMoveTo(next: PrimaryTicketViewScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryTicketViewScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary ticket view schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.bid - this.openRate) * 100) / 100;
  }

  copy(): PrimaryTicketViewSchedule {
    return new PrimaryTicketViewSchedule(
      this.code,
      this.label,
      this.ownerId,
      this.country,
      this.openRate,
      this.maximum,
      this.currency,
      this.pinned,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary ticket view schedule in status requested. */
export function newPrimaryTicketViewSchedule(code: string, label: string): PrimaryTicketViewSchedule {
  return new PrimaryTicketViewSchedule(code, label, "", "", 0, 0, "", false, 0, "requested");
}
