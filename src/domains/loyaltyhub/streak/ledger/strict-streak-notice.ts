import * as text from "../../../../kit/text.js";

/** Where a strict streak notice is in its life cycle. */
export type StrictStreakNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict streak notice as the streak team keeps it. */
export class StrictStreakNotice {
  code: string;
  label: string;
  durationMinutes: number;
  sendAt: number;
  currency: string;
  budget: number;
  contactEmail: string;
  amount: number;
  clicks: number;
  maximum: number;
  floorValue: number;
  status: StrictStreakNoticeStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    sendAt: number,
    currency: string,
    budget: number,
    contactEmail: string,
    amount: number,
    clicks: number,
    maximum: number,
    floorValue: number,
    status: StrictStreakNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.sendAt = sendAt;
    this.currency = currency;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.clicks = clicks;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictStreakNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictStreakNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict streak notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict streak notice"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount - this.floorValue) * 100) / 100;
  }

  copy(): StrictStreakNotice {
    return new StrictStreakNotice(
      this.code,
      this.label,
      this.durationMinutes,
      this.sendAt,
      this.currency,
      this.budget,
      this.contactEmail,
      this.amount,
      this.clicks,
      this.maximum,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict streak notice in status new. */
export function newStrictStreakNotice(code: string, label: string): StrictStreakNotice {
  return new StrictStreakNotice(code, label, 0, 0, "", 0, "", 0, 0, 0, 0, "new");
}
