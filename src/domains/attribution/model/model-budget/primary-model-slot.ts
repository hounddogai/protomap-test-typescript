import * as text from "../../../../kit/text.js";

/** Where a primary model slot is in its life cycle. */
export type PrimaryModelSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a primary model slot and its current status. */
export class PrimaryModelSlot {
  code: string;
  name: string;
  locale: string;
  bid: number;
  startsAt: number;
  campaignRef: string;
  unit: string;
  channel: string;
  externalRef: string;
  status: PrimaryModelSlotStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    bid: number,
    startsAt: number,
    campaignRef: string,
    unit: string,
    channel: string,
    externalRef: string,
    status: PrimaryModelSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.bid = bid;
    this.startsAt = startsAt;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.channel = channel;
    this.externalRef = externalRef;
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

  canMoveTo(next: PrimaryModelSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryModelSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary model slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary model slot"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.startsAt - this.bid) * 100) / 100;
  }

  copy(): PrimaryModelSlot {
    return new PrimaryModelSlot(
      this.code,
      this.name,
      this.locale,
      this.bid,
      this.startsAt,
      this.campaignRef,
      this.unit,
      this.channel,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary model slot in status draft. */
export function newPrimaryModelSlot(code: string, name: string): PrimaryModelSlot {
  return new PrimaryModelSlot(code, name, "", 0, 0, "", "", "", "", "draft");
}
