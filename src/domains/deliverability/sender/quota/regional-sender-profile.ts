import * as text from "../../../../kit/text.js";

/** Where a regional sender profile is in its life cycle. */
export type RegionalSenderProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a regional sender profile and its current status. */
export class RegionalSenderProfile {
  code: string;
  name: string;
  currency: string;
  floorValue: number;
  journeyId: string;
  locale: string;
  clicks: number;
  quantity: number;
  status: RegionalSenderProfileStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    floorValue: number,
    journeyId: string,
    locale: string,
    clicks: number,
    quantity: number,
    status: RegionalSenderProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.locale = locale;
    this.clicks = clicks;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSenderProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSenderProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.clicks - this.quantity) * 100) / 100;
  }

  copy(): RegionalSenderProfile {
    return new RegionalSenderProfile(
      this.code,
      this.name,
      this.currency,
      this.floorValue,
      this.journeyId,
      this.locale,
      this.clicks,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional sender profile in status proposed. */
export function newRegionalSenderProfile(code: string, name: string): RegionalSenderProfile {
  return new RegionalSenderProfile(code, name, "", 0, "", "", 0, 0, "proposed");
}
