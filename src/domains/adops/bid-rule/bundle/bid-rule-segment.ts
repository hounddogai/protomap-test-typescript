import * as text from "../../../../kit/text.js";

/** Where a bid rule segment is in its life cycle. */
export type BidRuleSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a bid rule segment and its current status. */
export class BidRuleSegment {
  code: string;
  label: string;
  createdAt: number;
  ownerId: string;
  phone: string;
  notes: string;
  ceiling: number;
  status: BidRuleSegmentStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    ownerId: string,
    phone: string,
    notes: string,
    ceiling: number,
    status: BidRuleSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.phone = phone;
    this.notes = notes;
    this.ceiling = ceiling;
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

  canMoveTo(next: BidRuleSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.createdAt + this.ceiling) * 100) / 100;
  }

  copy(): BidRuleSegment {
    return new BidRuleSegment(
      this.code,
      this.label,
      this.createdAt,
      this.ownerId,
      this.phone,
      this.notes,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule segment in status requested. */
export function newBidRuleSegment(code: string, label: string): BidRuleSegment {
  return new BidRuleSegment(code, label, 0, "", "", "", 0, "requested");
}
