import * as text from "../../../../kit/text.js";

/** Where a bounce adjustment is in its life cycle. */
export type BounceAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A bounce adjustment. Its code is unique within a tenant. */
export class BounceAdjustment {
  code: string;
  label: string;
  locale: string;
  frequencyCap: number;
  journeyId: string;
  timezone: string;
  sequence: number;
  expiresAt: number;
  bid: number;
  status: BounceAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    frequencyCap: number,
    journeyId: string,
    timezone: string,
    sequence: number,
    expiresAt: number,
    bid: number,
    status: BounceAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.sequence = sequence;
    this.expiresAt = expiresAt;
    this.bid = bid;
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

  canMoveTo(next: BounceAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BounceAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.sequence - this.frequencyCap) * 100) / 100;
  }

  copy(): BounceAdjustment {
    return new BounceAdjustment(
      this.code,
      this.label,
      this.locale,
      this.frequencyCap,
      this.journeyId,
      this.timezone,
      this.sequence,
      this.expiresAt,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bounce adjustment in status draft. */
export function newBounceAdjustment(code: string, label: string): BounceAdjustment {
  return new BounceAdjustment(code, label, "", 0, "", "", 0, 0, 0, "draft");
}
